import { ExecutionService } from '../src/execution/execution.service';

async function run() {
  const service = new ExecutionService();
  const code = `
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}`;
  const results = await service.executeCode('java', code, [
    { id: 1, input: '', expected: 'Hello World' },
  ]);
  console.log(JSON.stringify(results, null, 2));
}

run();
