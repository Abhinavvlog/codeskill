import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from '../entities/lesson.entity';
import { CourseExercise } from '../entities/course-exercise.entity';
import { LessonProgress } from '../entities/lesson-progress.entity';
import { CourseProgress } from '../entities/course-progress.entity';
import { PathProgress } from '../entities/path-progress.entity';
import { CourseModule } from '../entities/course-module.entity';
import { LearningPathCourse } from '../entities/learning-path-course.entity';
import { Problem } from '../../database/entities/problem.entity';
import { ExecutionService, Status } from '../../execution/execution.service';
import { GamificationService } from './gamification.service';
import { SubmitExerciseDto } from '../dto/course.dto';

@Injectable()
export class PracticeService {
  private readonly logger = new Logger(PracticeService.name);

  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepo: Repository<Lesson>,
    @InjectRepository(CourseExercise)
    private readonly exerciseRepo: Repository<CourseExercise>,
    @InjectRepository(LessonProgress)
    private readonly lessonProgressRepo: Repository<LessonProgress>,
    @InjectRepository(CourseProgress)
    private readonly courseProgressRepo: Repository<CourseProgress>,
    @InjectRepository(PathProgress)
    private readonly pathProgressRepo: Repository<PathProgress>,
    @InjectRepository(CourseModule)
    private readonly moduleRepo: Repository<CourseModule>,
    @InjectRepository(LearningPathCourse)
    private readonly lpcRepo: Repository<LearningPathCourse>,
    @InjectRepository(Problem)
    private readonly problemRepo: Repository<Problem>,
    private readonly executionService: ExecutionService,
    private readonly gamificationService: GamificationService,
  ) {}

  /**
   * Submit and evaluate an exercise (Coding or Quiz)
   */
  async submitExercise(
    exerciseId: string,
    studentId: string,
    dto: SubmitExerciseDto,
  ) {
    const exercise = await this.exerciseRepo.findOne({
      where: { id: exerciseId },
      relations: { lesson: true },
    });
    if (!exercise) {
      throw new NotFoundException(`Exercise not found: ${exerciseId}`);
    }

    let passed = false;
    let feedback: any = {};
    let score = 0;

    if (exercise.type === 'quiz') {
      const quizConfig = exercise.quizConfig;
      if (!quizConfig || !quizConfig.questions || quizConfig.questions.length === 0) {
        throw new BadRequestException('Quiz configuration is empty');
      }

      const totalQuestions = quizConfig.questions.length;
      let correctCount = 0;
      const questionResults: any[] = [];

      // Check answers
      const submittedAnswers = dto.answers || {};
      for (let i = 0; i < totalQuestions; i++) {
        const q = quizConfig.questions[i];
        const selected =
          submittedAnswers[q.id] !== undefined
            ? submittedAnswers[q.id]
            : dto.selectedOption !== undefined && totalQuestions === 1
            ? dto.selectedOption
            : -1;

        const isCorrect = selected === q.correctAnswer;
        if (isCorrect) correctCount++;

        questionResults.push({
          questionId: q.id,
          isCorrect,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
        });
      }

      score = Math.round((correctCount / totalQuestions) * 100);
      const passThreshold = exercise.lesson?.passingScore || 70;
      passed = score >= passThreshold;

      feedback = {
        totalQuestions,
        correctCount,
        score,
        passThreshold,
        passed,
        results: questionResults,
      };
    } else if (exercise.type === 'coding' || exercise.type === 'debugging') {
      if (!dto.code || !dto.language) {
        throw new BadRequestException('Code and language are required for coding exercises');
      }

      // Fetch test cases from linked Problem or default sanity check
      let testCases: any[] = [];
      if (exercise.problemId) {
        const problem = await this.problemRepo.findOne({
          where: { id: exercise.problemId },
        });
        if (problem && problem.testCases && problem.testCases.length > 0) {
          testCases = problem.testCases.map((tc, idx) => ({
            id: idx + 1,
            input: tc.input || '',
            expected: tc.output || '',
          }));
        }
      }

      if (testCases.length === 0) {
        // Fallback test case
        testCases = [{ id: 1, input: '', expected: '' }];
      }

      const results = await this.executionService.runCode(
        dto.code,
        dto.language,
        testCases,
        { timeLimit: 3000, memoryLimit: 256 },
      );

      const passedCount = results.filter(
        (r) => r.passed || r.status === Status.ACCEPTED,
      ).length;
      passed = passedCount === testCases.length;
      score = passed ? 100 : Math.round((passedCount / testCases.length) * 100);

      feedback = {
        passed,
        passedCount,
        totalCount: testCases.length,
        score,
        results: results.map((r) => ({
          id: r.id,
          passed: r.passed || r.status === Status.ACCEPTED,
          status: r.status,
          output: r.output,
          expected: r.expected,
          error: r.error,
        })),
      };
    }

    let xpAwarded = 0;
    let unlockedBadges: any[] = [];

    if (passed) {
      // Award XP
      const xpAmount = exercise.type === 'quiz' ? 15 : 25;
      xpAwarded = await this.gamificationService.awardXP(
        studentId,
        xpAmount,
        exercise.type === 'quiz' ? 'quiz_passed' : 'problem_solved',
        exercise.id,
        `Passed ${exercise.type}: ${exercise.title}`,
      );

      // Check badge triggers
      unlockedBadges = await this.gamificationService.checkAndAwardBadges(
        studentId,
        {
          type: exercise.type === 'quiz' ? 'quiz_completed' : 'problem_solved',
        },
      );

      // Check if all mandatory exercises in lesson are passed
      await this.evaluateLessonCompletion(exercise.lessonId, studentId);
    }

    return {
      passed,
      score,
      feedback,
      xpAwarded,
      unlockedBadges,
    };
  }

  /**
   * Complete reading lesson
   */
  async completeLesson(lessonId: string, studentId: string) {
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId },
      relations: { exercises: true },
    });
    if (!lesson) {
      throw new NotFoundException(`Lesson not found: ${lessonId}`);
    }

    // If lesson has mandatory exercises, ensure all are passed before allowing complete
    const mandatoryExercises = (lesson.exercises || []).filter((e) => e.isMandatory);
    if (mandatoryExercises.length > 0) {
      // For lessons with mandatory exercises, exercises must be submitted and passed
      // We check if progress is already completed
      const progress = await this.lessonProgressRepo.findOne({
        where: { studentId, lessonId },
      });
      if (!progress || progress.status !== 'completed') {
        throw new BadRequestException(
          'Please complete and pass all required practice exercises in this lesson before proceeding',
        );
      }
    }

    let progress = await this.lessonProgressRepo.findOne({
      where: { studentId, lessonId },
    });
    if (!progress) {
      progress = this.lessonProgressRepo.create({
        studentId,
        lessonId,
        status: 'completed',
        completedAt: new Date(),
        lastInteractedAt: new Date(),
      });
    } else {
      progress.status = 'completed';
      if (!progress.completedAt) progress.completedAt = new Date();
      progress.lastInteractedAt = new Date();
    }
    await this.lessonProgressRepo.save(progress);

    // Award lesson completion XP
    const xpAwarded = await this.gamificationService.awardXP(
      studentId,
      10,
      'lesson_completed',
      lessonId,
      `Completed lesson: ${lesson.title}`,
    );

    // Update course and path aggregates
    await this.recalculateCourseAndPathProgress(lessonId, studentId);

    return {
      lessonId,
      completed: true,
      completedAt: progress.completedAt,
      xpAwarded,
    };
  }

  /**
   * Checks if all mandatory exercises in a lesson are complete and updates lesson progress
   */
  private async evaluateLessonCompletion(lessonId: string, studentId: string) {
    let progress = await this.lessonProgressRepo.findOne({
      where: { studentId, lessonId },
    });
    if (!progress) {
      progress = this.lessonProgressRepo.create({
        studentId,
        lessonId,
        status: 'completed',
        completedAt: new Date(),
        lastInteractedAt: new Date(),
      });
    } else {
      progress.status = 'completed';
      if (!progress.completedAt) progress.completedAt = new Date();
      progress.lastInteractedAt = new Date();
    }
    await this.lessonProgressRepo.save(progress);
    await this.recalculateCourseAndPathProgress(lessonId, studentId);
  }

  /**
   * Recalculates progress percentages for course and path
   */
  private async recalculateCourseAndPathProgress(
    lessonId: string,
    studentId: string,
  ) {
    try {
      const lesson = await this.lessonRepo.findOne({
        where: { id: lessonId },
        relations: { module: true },
      });
      if (!lesson || !lesson.module) return;

      const courseId = lesson.module.courseId;
      // Get all modules and lessons in this course
      const allModules = await this.moduleRepo.find({
        where: { courseId },
        relations: { lessons: true },
      });

      const allCourseLessons: Lesson[] = [];
      for (const mod of allModules) {
        if (mod.lessons) allCourseLessons.push(...mod.lessons);
      }

      const totalLessonsCount = allCourseLessons.length;
      if (totalLessonsCount === 0) return;

      // Count completed lessons
      const lessonIds = allCourseLessons.map((l) => l.id);
      const completedProgress = await this.lessonProgressRepo
        .createQueryBuilder('lp')
        .where('lp.studentId = :studentId', { studentId })
        .andWhere('lp.lessonId IN (:...lessonIds)', { lessonIds })
        .andWhere('lp.status = :status', { status: 'completed' })
        .getMany();

      const completedCount = completedProgress.length;
      const percentage = Math.round((completedCount / totalLessonsCount) * 100);
      const isCourseCompleted = completedCount === totalLessonsCount;

      let courseProgress = await this.courseProgressRepo.findOne({
        where: { studentId, courseId },
      });
      if (!courseProgress) {
        courseProgress = this.courseProgressRepo.create({
          studentId,
          courseId,
          percentage,
          completedLessonsCount: completedCount,
          totalLessonsCount,
          status: isCourseCompleted ? 'completed' : 'in_progress',
          completedAt: isCourseCompleted ? new Date() : undefined,
        });
      } else {
        courseProgress.percentage = percentage;
        courseProgress.completedLessonsCount = completedCount;
        courseProgress.totalLessonsCount = totalLessonsCount;
        if (isCourseCompleted && courseProgress.status !== 'completed') {
          courseProgress.status = 'completed';
          courseProgress.completedAt = new Date();
          // Award Course Completion XP!
          await this.gamificationService.awardXP(
            studentId,
            100,
            'course_completed',
            courseId,
            'Completed full course',
          );
        }
      }
      await this.courseProgressRepo.save(courseProgress);

      // Next: recalculate path progress for paths containing this course
      const pathCourses = await this.lpcRepo.find({ where: { courseId } });
      for (const pc of pathCourses) {
        const pathId = pc.pathId;
        const allPathCourses = await this.lpcRepo.find({ where: { pathId } });
        const totalCourses = allPathCourses.length;
        if (totalCourses === 0) continue;

        const pathCourseIds = allPathCourses.map((c) => c.courseId);
        const completedCourses = await this.courseProgressRepo
          .createQueryBuilder('cp')
          .where('cp.studentId = :studentId', { studentId })
          .andWhere('cp.courseId IN (:...pathCourseIds)', { pathCourseIds })
          .andWhere('cp.status = :status', { status: 'completed' })
          .getMany();

        const completedCoursesCount = completedCourses.length;
        const pathPercentage = Math.round(
          (completedCoursesCount / totalCourses) * 100,
        );
        const isPathCompleted = completedCoursesCount === totalCourses;

        let pathProgress = await this.pathProgressRepo.findOne({
          where: { studentId, pathId },
        });
        if (!pathProgress) {
          pathProgress = this.pathProgressRepo.create({
            studentId,
            pathId,
            percentage: pathPercentage,
            completedCoursesCount,
            totalCoursesCount: totalCourses,
            status: isPathCompleted ? 'completed' : 'in_progress',
            completedAt: isPathCompleted ? new Date() : undefined,
          });
        } else {
          pathProgress.percentage = pathPercentage;
          pathProgress.completedCoursesCount = completedCoursesCount;
          pathProgress.totalCoursesCount = totalCourses;
          if (isPathCompleted && pathProgress.status !== 'completed') {
            pathProgress.status = 'completed';
            pathProgress.completedAt = new Date();
            // Award Path Completion XP!
            await this.gamificationService.awardXP(
              studentId,
              500,
              'path_completed',
              pathId,
              'Completed full learning path',
            );
            // Award Champion badge trigger
            await this.gamificationService.checkAndAwardBadges(studentId, {
              type: 'path_completed',
              pathId,
            });
          }
        }
        await this.pathProgressRepo.save(pathProgress);
      }
    } catch (err) {
      this.logger.error(`Error recalculating progress: ${err.message}`);
    }
  }
}
