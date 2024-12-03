import { ToolFunction } from '../types';

interface CalculatorArgs {
  operation: 'add' | 'subtract' | 'multiply' | 'divide';
  numbers: number[];
}

const calculatorTool: ToolFunction = {
  definition: {
    name: "calculate",
    description: "Perform basic arithmetic operations on a list of numbers",
    parameters: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          enum: ["add", "subtract", "multiply", "divide"],
          description: "The arithmetic operation to perform"
        },
        numbers: {
          type: "array",
          items: {
            type: "number"
          },
          description: "List of numbers to perform the operation on"
        }
      },
      required: ["operation", "numbers"]
    }
  },
  handler: async (args: CalculatorArgs) => {
    if (args.numbers.length < 2) {
      throw new Error("At least two numbers are required");
    }

    let result: number;
    switch (args.operation) {
      case 'add':
        result = args.numbers.reduce((a, b) => a + b);
        break;
      case 'subtract':
        result = args.numbers.reduce((a, b) => a - b);
        break;
      case 'multiply':
        result = args.numbers.reduce((a, b) => a * b);
        break;
      case 'divide':
        if (args.numbers.some(n => n === 0)) {
          throw new Error("Cannot divide by zero");
        }
        result = args.numbers.reduce((a, b) => a / b);
        break;
      default:
        throw new Error(`Unknown operation: ${args.operation}`);
    }

    return {
      operation: args.operation,
      numbers: args.numbers,
      result
    };
  }
};

export default calculatorTool; 