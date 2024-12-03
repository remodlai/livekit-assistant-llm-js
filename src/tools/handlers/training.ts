export async function handleTraining(args: {
  action: string;
  title?: string;
  description?: string;
  sequence_id?: string;
  step_content?: string;
  step_number?: number;
  context: {
    thread_id: string;
    assistant_id: string;
    org_id?: string;
  }
}) {
  try {
    switch (args.action) {
      case 'init':
        if (!args.title || !args.description) {
          throw new Error('Title and description required for init');
        }
        return await trainingFactory.initSequence(args.title, args.description, args.context);

      case 'add_step':
        if (!args.sequence_id || !args.step_content || args.step_number === undefined) {
          throw new Error('sequence_id, step_content, and step_number required for add_step');
        }
        return await trainingFactory.addStep(args.sequence_id, args.step_content, args.step_number, args.context);

      // ... other actions
    }
  } catch (error) {
    console.error('Error in training_sequence tool:', error);
    throw error;
  }
} 