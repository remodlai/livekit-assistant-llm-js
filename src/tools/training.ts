import { trainingSequenceFactory } from '../memory/factories/trainingSequenceFactory';

const toolDefinition = {
  name: "training_sequence",
  description: "Create and manage training sequences. Used when Sam needs to document training steps, procedures, or knowledge in a structured way.",
  strict: true,
  parameters: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: [
          "init", 
          "add_step", 
          "add_exception", 
          "complete",
          "ask_clarification",
          "request_example",     // Ask for an example
          "propose_example",     // Suggest a sample scenario
          "validate_example",    // Get feedback on proposed example
          "store_example",        // Store approved example
          "find_related_training",    // Search for related training sequences
          "confirm_existing_training", // Verify if existing training applies
          "suggest_training_merge",    // Suggest combining aspects of different training
          "request_training_diff",      // Request comparison of training differences
          "reject_existing_training",    // Explain why existing training doesn't apply
          "suggest_new_training",        // Suggest creating new training when existing doesn't fit
          "request_visual_example",     // Request photo/image example
          "request_documentation",      // Request supporting documentation
          "store_training_asset",       // Store provided document/image
        ],
        description: "The action to perform on the training sequence"
      },
      title: {
        type: ["string", "null"],
        description: "Title of the training sequence (required for init)"
      },
      description: {
        type: ["string", "null"],
        description: "Description of the training sequence (required for init)"
      },
      training_level: {
        type: ["string", "null"],
        enum: ["core", "org_core", "contextual"],
        description: "The level of training (core: fundamental regardless of org, org_core: fundamental to specific org, contextual: situation-specific)"
      },
      sequence_id: {
        type: ["string", "null"],
        description: "ID of existing sequence (required for add_step, add_exception, complete)"
      },
      step_content: {
        type: ["string", "null"],
        description: "Content of the step (required for add_step)"
      },
      step_number: {
        type: ["number", "null"],
        description: "Number of the step (required for add_step)"
      },
      exception_content: {
        type: ["string", "null"],
        description: "Content of the exception (required for add_exception)"
      },
      related_step: {
        type: ["number", "null"],
        description: "Step number the exception relates to (required for add_exception)"
      }
    },
    required: ["action"],
    additionalProperties: false
  }
};

async function handler(args: any) {
  try {
    // Log incoming context
    console.log('Training sequence handler args:', args);

    // Extract baseContext from args.context
    const baseContext = {
      thread_id: args.context?.thread_id,
      assistant_id: args.context?.assistant_id,
      org_id: args.context?.org_id,
      user_id: args.context?.user_id,
      project_id: args.context?.project_id,
      property_id: args.context?.property_id
    };

    // Validate we have minimum required context
    if (!baseContext.thread_id || !baseContext.assistant_id) {
      throw new Error('Missing required context (thread_id and assistant_id)');
    }

    switch (args.action) {
      case 'init':
        if (!args.title || !args.description) {
          throw new Error('Title and description required for init');
        }
        return await trainingSequenceFactory.initSequence(args.title, args.description, baseContext);

      case 'add_step':
        if (!args.sequence_id || !args.step_content || args.step_number === undefined) {
          throw new Error('sequence_id, step_content, and step_number required for add_step');
        }
        return await trainingSequenceFactory.addStep(args.sequence_id, args.step_content, args.step_number, baseContext);

      case 'add_exception':
        if (!args.sequence_id || !args.exception_content || args.related_step === undefined) {
          throw new Error('sequence_id, exception_content, and related_step required for add_exception');
        }
        return await trainingSequenceFactory.addException(args.sequence_id, args.exception_content, args.related_step, baseContext);

      case 'complete':
        if (!args.sequence_id) {
          throw new Error('sequence_id required for complete');
        }
        return await trainingSequenceFactory.completeSequence(args.sequence_id, baseContext);

      default:
        throw new Error(`Unknown action: ${args.action}`);
    }
  } catch (error) {
    console.error('Error in training_sequence tool:', error);
    throw error;
  }
}

export = {
  definition: toolDefinition,
  handler
}; 