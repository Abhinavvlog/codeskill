import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssessmentAttempt } from '../database/entities/assessment-attempt.entity';
import { Assessment } from '../database/entities/assessment.entity';
import { Question } from '../database/entities/question.entity';
import type { Response } from 'express';
import { renderToStream } from '@react-pdf/renderer';
import { StudentResultReport, StudentResult } from './student-result.pdf';
import * as React from 'react';

@Controller('reports')
export class ReportsController {
  constructor(
    @InjectRepository(AssessmentAttempt)
    private readonly attemptRepo: Repository<AssessmentAttempt>,
    @InjectRepository(Assessment)
    private readonly assessmentRepo: Repository<Assessment>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
  ) {}

  @Get('assessment-attempt/:attemptId')
  async getStudentResultReport(
    @Param('attemptId') attemptId: string,
    @Res() res: Response,
  ) {
    if (!attemptId) {
      throw new BadRequestException('Invalid attempt ID');
    }

    const attempt = await this.attemptRepo.findOne({
      where: [{ id: attemptId }, { mongoId: attemptId }],
    });
    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    const assessmentId = attempt.assessmentId;
    const assessment = await this.assessmentRepo.findOne({
      where: [{ id: assessmentId }, { mongoId: assessmentId }],
    });
    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    // Populate question details for responses
    const responses = Array.isArray(attempt.responses) ? attempt.responses : [];
    const questions = await Promise.all(
      responses.map(async (resp: any) => {
        const q = resp.questionId
          ? await this.questionRepo.findOne({
              where: [{ id: resp.questionId }, { mongoId: resp.questionId }],
            })
          : null;
        const item: {
          id: string;
          title: string;
          difficulty: string;
          status: 'Passed' | 'Failed' | 'Partial';
          points: number;
        } = {
          id: String(resp.questionId || 'unknown'),
          title: q?.title ? q.title : 'Assessment Question',
          difficulty: q?.difficulty ? q.difficulty : 'Medium',
          status: resp.isCorrect ? 'Passed' : resp.marksAwarded > 0 ? 'Partial' : 'Failed',
          points: Number(resp.marksAwarded || 0),
        };
        return item;
      }),
    );

    const resultData: StudentResult = {
      studentName: attempt.studentName || 'Unknown Student',
      studentEmail: attempt.studentEmail || 'No Email',
      examName: assessment.title,
      dateTaken: attempt.startedAt
        ? new Date(attempt.startedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'Unknown Date',
      score: attempt.score || 0,
      maxScore: attempt.maxScore || 100,
      duration: `${Math.floor((attempt.timeSpentSeconds || 0) / 60)}m ${(attempt.timeSpentSeconds || 0) % 60}s`,
      questions,
    };

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="result-${attempt.studentUid || attempt.id}.pdf"`,
    });

    try {
      const stream = await renderToStream(
        React.createElement(StudentResultReport, { result: resultData }) as any,
      );
      stream.pipe(res);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error generating PDF');
    }
  }
}
