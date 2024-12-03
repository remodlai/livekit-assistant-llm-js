import { ToolFunction } from '../types';

interface WeatherArgs {
  location: string;
  units?: 'celsius' | 'fahrenheit';
}

const weatherTool: ToolFunction = {
  definition: {
    name: "get_weather",
    description: "Get the current weather for a location",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The city and country to get weather for (e.g. 'London, UK')"
        },
        units: {
          type: "string",
          enum: ["celsius", "fahrenheit"],
          description: "Temperature units to return"
        }
      },
      required: ["location"]
    }
  },
  handler: async (args: WeatherArgs) => {
    // This is a mock implementation
    // In a real app, you would call a weather API here
    console.log('Getting weather for:', args.location);
    
    const mockWeather = {
      location: args.location,
      temperature: 22,
      units: args.units || 'celsius',
      conditions: 'sunny',
      humidity: 45,
      wind_speed: 10
    };
    
    return mockWeather;
  }
};

export default weatherTool; 