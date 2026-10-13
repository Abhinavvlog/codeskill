import * as path from 'path';
import {
  ExecutionConfig,
  ExecutionMode,
  FunctionParameter,
  FunctionSignature,
  canonicalLanguage,
} from './execution.types';

export interface Command {
  cmd: string;
  args: string[];
}

export interface PreparedSource {
  filename: string;
  source: string;
  entryPoint?: string;
}

export interface ResolvedFunctionSignature {
  className: string;
  functionName: string;
  returnType: string;
  parameters: FunctionParameter[];
}

export interface LanguageAdapter {
  readonly id: 'c' | 'cpp' | 'java' | 'python' | 'javascript' | 'typescript';
  readonly compiled: boolean;
  readonly sandboxImage: string;
  prepare(
    code: string,
    mode: ExecutionMode,
    signature?: FunctionSignature,
  ): PreparedSource;
  compileCommand(
    sourcePath: string,
    outputPath: string,
    cwd: string,
  ): Command | undefined;
  runCommand(
    sourcePath: string,
    outputPath: string,
    cwd: string,
    prepared: PreparedSource,
  ): Command;
}

const functionSignatureOrThrow = (
  signature: FunctionSignature | undefined,
): ResolvedFunctionSignature => {
  if (!signature?.functionName) {
    throw new Error(
      'Function-mode problems require functionSignature.functionName',
    );
  }
  return {
    className: signature.className || 'Solution',
    functionName: signature.functionName,
    returnType: signature.returnType || 'auto',
    parameters: signature.parameters || [],
  };
};

const cppType = (type: string): string => {
  const normalized = type.replace(/\s/g, '').toLowerCase();
  const aliases: Record<string, string> = {
    int: 'int',
    integer: 'int',
    number: 'long long',
    long: 'long long',
    longlong: 'long long',
    float: 'double',
    double: 'double',
    boolean: 'bool',
    bool: 'bool',
    string: 'string',
    'int[]': 'vector<int>',
    'integer[]': 'vector<int>',
    'number[]': 'vector<long long>',
    'string[]': 'vector<string>',
  };
  if (aliases[normalized]) return aliases[normalized];
  if (normalized.endsWith('[]')) return `vector<${cppType(type.slice(0, -2))}>`;
  if (normalized.startsWith('list<') || normalized.startsWith('vector<')) {
    return `vector<${cppType(type.slice(type.indexOf('<') + 1, -1))}>`;
  }
  return type;
};

const CPP_RUNTIME = String.raw`
static string csTrim(string value) {
  const auto first = value.find_first_not_of(" \t\r\n");
  if (first == string::npos) return "";
  const auto last = value.find_last_not_of(" \t\r\n");
  return value.substr(first, last - first + 1);
}
static vector<string> csArgs(string input) {
  input = csTrim(input);
  if (input.empty()) return {""};
  if (input.front() != '[') return {input};
  vector<string> values; string current; int depth = 0; bool quoted = false; bool escaped = false;
  for (size_t index = 1; index + 1 < input.size(); ++index) {
    const char ch = input[index];
    if (quoted) { current += ch; if (!escaped && ch == '"') quoted = false; escaped = !escaped && ch == '\\'; continue; }
    if (ch == '"') { quoted = true; current += ch; continue; }
    if (ch == '[' || ch == '{') ++depth;
    if (ch == ']' || ch == '}') --depth;
    if (ch == ',' && depth == 0) { values.push_back(csTrim(current)); current.clear(); } else current += ch;
  }
  values.push_back(csTrim(current));
  return values;
}
static string csString(string value) {
  value = csTrim(value);
  if (value.size() >= 2 && value.front() == '"' && value.back() == '"') {
    value = value.substr(1, value.size() - 2);
    string result; bool escaped = false;
    for (char ch : value) {
      if (escaped) { result += ch == 'n' ? '\n' : ch; escaped = false; }
      else if (ch == '\\') escaped = true;
      else result += ch;
    }
    return result;
  }
  return value;
}
template <typename T> struct CsRead {
  static T parse(const string& value) {
    istringstream input(csTrim(value)); T result{}; input >> result; return result;
  }
};
template <> struct CsRead<string> { static string parse(const string& value) { return csString(value); } };
template <> struct CsRead<bool> { static bool parse(const string& value) { return csTrim(value) == "true" || csTrim(value) == "1"; } };
template <typename T> struct CsRead<vector<T>> {
  static vector<T> parse(const string& value) {
    string input = csTrim(value);
    if (input.size() < 2 || input.front() != '[' || input.back() != ']') throw runtime_error("Expected JSON array");
    vector<T> result; for (const string& item : csArgs(input)) result.push_back(CsRead<T>::parse(item)); return result;
  }
};
template <typename T> string csOutput(const T& value) { ostringstream output; output << value; return output.str(); }
template <> string csOutput<bool>(const bool& value) { return value ? "true" : "false"; }
template <typename T> string csOutput(const vector<T>& values) {
  string result = "["; for (size_t index = 0; index < values.size(); ++index) { if (index) result += ","; result += csOutput(values[index]); } return result + "]";
}
`;

class CppAdapter implements LanguageAdapter {
  readonly id = 'cpp' as const;
  readonly compiled = true;
  readonly sandboxImage = process.env.JUDGE_CPP_IMAGE || 'gcc:13';

  prepare(
    code: string,
    mode: ExecutionMode,
    signature?: FunctionSignature,
  ): PreparedSource {
    if (mode === 'standard') return { filename: 'solution.cpp', source: code };
    const details = functionSignatureOrThrow(signature);
    const argumentsSource = details.parameters
      .map(
        (parameter, index) =>
          `CsRead<${cppType(parameter.type)}>::parse(args.at(${index}))`,
      )
      .join(', ');
    return {
      filename: 'solution.cpp',
      source: [
        '#include <bits/stdc++.h>',
        'using namespace std;',
        CPP_RUNTIME,
        code,
        'int main() {',
        '  try {',
        '    string input((istreambuf_iterator<char>(cin)), istreambuf_iterator<char>());',
        '    vector<string> args = csArgs(input);',
        `    ${details.className} solution;`,
        `    auto result = solution.${details.functionName}(${argumentsSource});`,
        '    cout << csOutput(result) << endl;',
        '    return 0;',
        '  } catch (const exception& error) { cerr << error.what() << endl; return 1; }',
        '}',
      ].join('\n'),
    };
  }

  compileCommand(sourcePath: string, outputPath: string): Command {
    return {
      cmd: 'g++',
      args: [
        '-std=c++17',
        '-O2',
        '-pipe',
        '-Wall',
        sourcePath,
        '-o',
        outputPath,
      ],
    };
  }

  runCommand(_sourcePath: string, outputPath: string): Command {
    return { cmd: outputPath, args: [] };
  }
}

const javaArgument = (type: string, value: string): string => {
  const normalized = type.replace(/\s/g, '').toLowerCase();
  if (['int', 'integer'].includes(normalized))
    return `Integer.parseInt(${value})`;
  if (['number', 'long', 'longlong'].includes(normalized))
    return `Long.parseLong(${value})`;
  if (['float', 'double'].includes(normalized))
    return `Double.parseDouble(${value})`;
  if (['boolean', 'bool'].includes(normalized))
    return `Boolean.parseBoolean(${value})`;
  return `csString(${value})`;
};

class JavaAdapter implements LanguageAdapter {
  readonly id = 'java' as const;
  readonly compiled = true;
  readonly sandboxImage =
    process.env.JUDGE_JAVA_IMAGE || 'eclipse-temurin:17-jdk';

  prepare(
    code: string,
    mode: ExecutionMode,
    signature?: FunctionSignature,
  ): PreparedSource {
    if (mode === 'standard') {
      const publicClass = code.match(
        /public\s+(?:final\s+)?class\s+([A-Za-z_][A-Za-z0-9_]*)/,
      );
      const namedClass = code.match(
        /(?:public\s+)?(?:final\s+)?class\s+([A-Za-z_][A-Za-z0-9_]*)/,
      );
      if (!namedClass) {
        return {
          filename: 'Main.java',
          entryPoint: 'Main',
          source: `public class Main {\n  public static void main(String[] args) throws Exception {\n${code}\n  }\n}`,
        };
      }
      return {
        filename: `${publicClass?.[1] || 'Main'}.java`,
        entryPoint: publicClass?.[1] || namedClass[1],
        source: code,
      };
    }
    const details = functionSignatureOrThrow(signature);
    const imports =
      code.match(/^\s*import\s+[\w.*]+\s*;\s*$/gm)?.join('\n') || '';
    const studentCode = code
      .replace(/^\s*import\s+[\w.*]+\s*;\s*$/gm, '')
      .replace(
        new RegExp(`public\\s+(?:final\\s+)?class\\s+${details.className}\\b`),
        `class ${details.className}`,
      );
    const argumentsSource = details.parameters
      .map((parameter, index) =>
        javaArgument(parameter.type, `args.get(${index})`),
      )
      .join(', ');
    return {
      filename: 'Main.java',
      entryPoint: 'Main',
      source: [
        imports,
        'import java.io.*;',
        'import java.util.*;',
        studentCode,
        'public class Main {',
        '  private static String csString(String value) { value = value.trim(); return value.length() > 1 && value.startsWith("\\\"") && value.endsWith("\\\"") ? value.substring(1, value.length() - 1) : value; }',
        '  private static List<String> csArgs(String input) { input = input.trim(); if (!input.startsWith("[")) return List.of(input); input = input.substring(1, input.length() - 1); if (input.trim().isEmpty()) return List.of(); return Arrays.asList(input.split(",")); }',
        '  public static void main(String[] values) throws Exception {',
        '    String input = new String(System.in.readAllBytes());',
        '    List<String> args = csArgs(input);',
        `    ${details.className} solution = new ${details.className}();`,
        `    System.out.println(solution.${details.functionName}(${argumentsSource}));`,
        '  }',
        '}',
      ]
        .filter(Boolean)
        .join('\n'),
    };
  }

  compileCommand(
    sourcePath: string,
    _outputPath: string,
    cwd: string,
  ): Command {
    return {
      cmd: 'javac',
      args: ['-encoding', 'UTF-8', '-d', cwd, sourcePath],
    };
  }

  runCommand(
    _sourcePath: string,
    _outputPath: string,
    cwd: string,
    prepared: PreparedSource,
  ): Command {
    return { cmd: 'java', args: ['-cp', cwd, prepared.entryPoint || 'Main'] };
  }
}

class PythonAdapter implements LanguageAdapter {
  readonly id = 'python' as const;
  readonly compiled = false;
  readonly sandboxImage =
    process.env.JUDGE_PYTHON_IMAGE || 'python:3.12-alpine';

  prepare(
    code: string,
    mode: ExecutionMode,
    signature?: FunctionSignature,
  ): PreparedSource {
    if (mode === 'standard') return { filename: 'solution.py', source: code };
    const details = functionSignatureOrThrow(signature);
    const names = details.parameters.map((parameter) => parameter.name);
    const target = details.className
      ? `${details.className}().${details.functionName}`
      : details.functionName;
    return {
      filename: 'solution.py',
      source: [
        code,
        'import json as __codeskill_json',
        'import sys as __codeskill_sys',
        '__codeskill_input = __codeskill_json.loads(__codeskill_sys.stdin.read() or "null")',
        `__codeskill_names = ${JSON.stringify(names)}`,
        '__codeskill_args = [__codeskill_input[name] for name in __codeskill_names] if isinstance(__codeskill_input, dict) else (__codeskill_input if isinstance(__codeskill_input, list) else [__codeskill_input])',
        `__codeskill_result = ${target}(*__codeskill_args)`,
        'print(__codeskill_json.dumps(__codeskill_result, separators=(",", ":")) if isinstance(__codeskill_result, (dict, list, tuple, bool)) or __codeskill_result is None else __codeskill_result)',
      ].join('\n'),
    };
  }

  compileCommand(): undefined {
    return undefined;
  }

  runCommand(sourcePath: string): Command {
    return { cmd: 'python3', args: [sourcePath] };
  }
}

class JavaScriptAdapter implements LanguageAdapter {
  readonly id = 'javascript' as const;
  readonly compiled = false;
  readonly sandboxImage = process.env.JUDGE_NODE_IMAGE || 'node:20-alpine';

  prepare(
    code: string,
    mode: ExecutionMode,
    signature?: FunctionSignature,
  ): PreparedSource {
    if (mode === 'standard') return { filename: 'solution.js', source: code };
    const details = functionSignatureOrThrow(signature);
    const names = details.parameters.map((parameter) => parameter.name);
    const target = details.className
      ? `new ${details.className}().${details.functionName}`
      : details.functionName;
    return {
      filename: 'solution.js',
      source: [
        code,
        'const __codeskill_input = JSON.parse(require("fs").readFileSync(0, "utf8") || "null");',
        `const __codeskill_names = ${JSON.stringify(names)};`,
        'const __codeskill_args = Array.isArray(__codeskill_input) ? __codeskill_input : (__codeskill_input && typeof __codeskill_input === "object" ? __codeskill_names.map((name) => __codeskill_input[name]) : [__codeskill_input]);',
        `const __codeskill_result = (${target})(...__codeskill_args);`,
        'console.log(typeof __codeskill_result === "string" ? __codeskill_result : JSON.stringify(__codeskill_result));',
      ].join('\n'),
    };
  }

  compileCommand(): undefined {
    return undefined;
  }

  runCommand(sourcePath: string): Command {
    return { cmd: 'node', args: [sourcePath] };
  }
}

class TypeScriptAdapter implements LanguageAdapter {
  readonly id = 'typescript' as const;
  readonly compiled = false;
  readonly sandboxImage =
    process.env.JUDGE_TS_IMAGE ||
    process.env.JUDGE_NODE_IMAGE ||
    'node:20-alpine';

  prepare(
    code: string,
    mode: ExecutionMode,
    signature?: FunctionSignature,
  ): PreparedSource {
    if (mode === 'standard') return { filename: 'solution.ts', source: code };
    const details = functionSignatureOrThrow(signature);
    const names = details.parameters.map((parameter) => parameter.name);
    const target = details.className
      ? `new (${details.className} as any)().${details.functionName}`
      : details.functionName;
    return {
      filename: 'solution.ts',
      source: [
        code,
        'const __codeskill_input = JSON.parse(require("fs").readFileSync(0, "utf8") || "null");',
        `const __codeskill_names = ${JSON.stringify(names)};`,
        'const __codeskill_args = Array.isArray(__codeskill_input) ? __codeskill_input : (__codeskill_input && typeof __codeskill_input === "object" ? __codeskill_names.map((name: string) => __codeskill_input[name]) : [__codeskill_input]);',
        `const __codeskill_result = (${target})(...__codeskill_args);`,
        'console.log(typeof __codeskill_result === "string" ? __codeskill_result : JSON.stringify(__codeskill_result));',
      ].join('\n'),
    };
  }

  compileCommand(): undefined {
    return undefined;
  }

  runCommand(sourcePath: string): Command {
    return { cmd: 'npx', args: ['--yes', 'tsx', sourcePath] };
  }
}

class CAdapter implements LanguageAdapter {
  readonly id = 'c' as const;
  readonly compiled = true;
  readonly sandboxImage = process.env.JUDGE_C_IMAGE || 'gcc:13';

  prepare(code: string, mode: ExecutionMode): PreparedSource {
    if (mode === 'function')
      throw new Error('Function execution mode is not supported for C');
    return { filename: 'solution.c', source: code };
  }

  compileCommand(sourcePath: string, outputPath: string): Command {
    return {
      cmd: 'gcc',
      args: [
        '-std=c11',
        '-O2',
        '-pipe',
        '-Wall',
        sourcePath,
        '-o',
        outputPath,
        '-lm',
      ],
    };
  }

  runCommand(_sourcePath: string, outputPath: string): Command {
    return { cmd: outputPath, args: [] };
  }
}

const ADAPTERS: Record<
  NonNullable<ReturnType<typeof canonicalLanguage>>,
  LanguageAdapter
> = {
  c: new CAdapter(),
  cpp: new CppAdapter(),
  java: new JavaAdapter(),
  python: new PythonAdapter(),
  javascript: new JavaScriptAdapter(),
  typescript: new TypeScriptAdapter(),
};

export function getLanguageAdapter(
  language: string,
): LanguageAdapter | undefined {
  const normalized = canonicalLanguage(language);
  return normalized ? ADAPTERS[normalized] : undefined;
}

export function getSandboxImage(
  language: string,
  config: ExecutionConfig,
): string | undefined {
  return config.sandboxImage || getLanguageAdapter(language)?.sandboxImage;
}

export function commandBasename(command: Command, cwd: string): Command {
  const convert = (value: string) => {
    if (!path.isAbsolute(value)) return value;
    const relative = path.relative(cwd, value);
    return relative && !relative.startsWith('..') && !path.isAbsolute(relative)
      ? path.posix.join('/workspace', relative.split(path.sep).join('/'))
      : value;
  };
  return { cmd: convert(command.cmd), args: command.args.map(convert) };
}
