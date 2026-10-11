import { ExecutionService } from '../src/execution/execution.service';

async function run() {
  const service = new ExecutionService();
  const code = `
#include <iostream>
using namespace std;
int main() {
    int* p = nullptr;
    *p = 42;
    return 0;
}`;
  const results = await service.executeCode('cpp', code, [
    { id: 1, input: '', expected: 'anything' },
  ]);
  console.log(JSON.stringify(results, null, 2));
}

run();
