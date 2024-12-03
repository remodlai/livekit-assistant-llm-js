const admin = require('@remodl/firebase-init');
const { queueVectorUpsert } = require('../pinecone_memory/queueHandlers/vectorQueueHandler');
const { generateDenseVector } = require('../pinecone_memory/vectorUtils');
const { generateSubjectKey } = require('../pinecone_memory/utils/progressiveMemoryUtils');

exports.trainingSequenceFactory = {
  // Initialize new sequence
  initSequence: async (title, description, context, training_level = 'contextual') => {
    try {
      // Extract context from description
      const extractedContext = await extractTrainingContext(description);
      
      const sequenceId = `training_${title.toLowerCase().replace(/\s+/g, '_')}`;
      const subjectKey = await generateSubjectKey({
        type: 'training_sequence',
        subject: sequenceId,
        org_id: training_level === 'org_core' ? context.org_id : 'remodl'
      });

      // Create sequence document with context requirements
      const sequenceRef = admin.firestore().collection('training_sequences').doc(sequenceId);
      await sequenceRef.set({
        sequence_id: sequenceId,
        title,
        description,
        training_level,
        context_triggers: extractedContext.context_triggers,
        context_requirements: extractedContext.context_requirements,
        is_multi_step: null,
        current_step: 0,
        total_steps: null,
        status: 'in_progress',
        exceptions: [],
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        completed_at: null,
        context: {
          thread_id: context.thread_id,
          assistant_id: context.assistant_id,
          org_id: context.org_id
        },
        progressive_tracking: {
          subject_key: subjectKey,
          is_latest: true,
          version: 1,
          version_chain: [],
          previous_version: null,
          next_version: null,
          relationships: {
            applies_to: [],      // Other sequences this one applies to
            extends: [],         // Sequences this one builds upon
            related_to: [],      // Generally related sequences
            prerequisites: [],   // Must know these first
            exceptions_to: []    // Sequences this one provides exceptions for
          },
          context_graph: {
            nodes: [],          // Connected concepts/topics
            edges: []           // Relationship types between nodes
          }
        }
      });

      const sequenceVector = {
        id: `training_sequence_${sequenceId}`,
        values: await generateDenseVector(JSON.stringify({
          title,
          description,
          type: 'training_sequence',
          training_level,
          context_triggers: extractedContext.context_triggers.join(' '),
          context_requirements: extractedContext.context_requirements
        })),
        metadata: {
          type: 'training_sequence',
          sequence_id: sequenceId,
          title,
          description,
          training_level,
          context_triggers: extractedContext.context_triggers,
          context_requirements: extractedContext.context_requirements,
          content: JSON.stringify({ 
            title, 
            description, 
            type: 'training_sequence',
            training_level,
            context_triggers: extractedContext.context_triggers,
            context_requirements: extractedContext.context_requirements
          }),
          content_display: `Training sequence (${training_level}): ${title} - ${description}`,
          status: 'in_progress',
          thread_id: context.thread_id,
          assistant_id: context.assistant_id,
          org_id: training_level === 'org_core' ? context.org_id : 'remodl',
          timestamp: new Date().toISOString()
        }
      };

      await queueVectorUpsert([sequenceVector], {
        namespace_type: training_level === 'org_core' ? 'org' : 'remodl',
        content_type: 'training'
      });

      return { sequenceId, subjectKey };
    } catch (error) {
      console.error('Error initializing training sequence:', error);
      throw error;
    }
  },

  // Add step to sequence
  addStep: async (sequenceId, stepContent, stepNumber, context) => {
    try {
      const sequenceRef = admin.firestore().collection('training_sequences').doc(sequenceId);
      const sequence = await sequenceRef.get();
      
      if (!sequence.exists) {
        throw new Error(`Training sequence ${sequenceId} not found`);
      }

      const subjectKey = await generateSubjectKey({
        type: 'training_sequence',
        subject: sequenceId,
        org_id: 'remodl'
      });

      // Create structured memory for step
      const stepRef = admin.firestore().collection('structured_memories').doc();
      await stepRef.set({
        type: 'training_step',
        content: stepContent,
        content_display: stepContent,
        sequence_context: {
          sequence_id: sequenceId,
          step_number: stepNumber,
          total_steps: sequence.data().total_steps,
          is_complete: false,
          is_exception: false,
          related_step: null
        },
        progressive_tracking: {
          subject_key: subjectKey,
          is_latest: true,
          version: 1,
          version_chain: [],
          previous_version: null,
          next_version: null
        },
        metadata: {
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
          org_id: 'remodl',
          thread_id: context.thread_id,
          importance: 'high'  // Training steps are always high importance
        }
      });

      const stepVector = {
        id: `training_step_${stepRef.id}`,
        values: await generateDenseVector(stepContent),
        metadata: {
          type: 'training_step',
          sequence_id: sequenceId,
          step_number: stepNumber,
          content: stepContent,
          content_display: stepContent,
          instructional_content: stepContent,
          thread_id: context.thread_id,
          timestamp: new Date().toISOString(),
          total_steps: sequence.data().total_steps,
          sequence_title: sequence.data().title,
          sequence_description: sequence.data().description
        }
      };

      await queueVectorUpsert([stepVector], {
        namespace_type: 'remodl',
        content_type: 'training'
      });

      // Update sequence document
      await sequenceRef.update({
        current_step: stepNumber,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      return { success: true, stepId: stepRef.id };
    } catch (error) {
      console.error('Error adding training step:', error);
      throw error;
    }
  },

  // Add exception to sequence
  addException: async (sequenceId, exceptionContent, relatedStep, context) => {
    try {
      const sequenceRef = admin.firestore().collection('training_sequences').doc(sequenceId);
      const sequence = await sequenceRef.get();
      
      if (!sequence.exists) {
        throw new Error(`Training sequence ${sequenceId} not found`);
      }

      const subjectKey = await generateSubjectKey({
        type: 'training_sequence',
        subject: sequenceId,
        org_id: 'remodl'
      });

      // Create structured memory for exception
      const exceptionRef = admin.firestore().collection('structured_memories').doc();
      await exceptionRef.set({
        type: 'training_step',
        content: exceptionContent,
        content_display: `Exception to step ${relatedStep}: ${exceptionContent}`,
        sequence_context: {
          sequence_id: sequenceId,
          step_number: relatedStep,
          total_steps: sequence.data().total_steps,
          is_complete: false,
          is_exception: true,
          related_step: relatedStep
        },
        progressive_tracking: {
          subject_key: subjectKey,
          is_latest: true,
          version: 1,
          version_chain: [],
          previous_version: null,
          next_version: null
        },
        metadata: {
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
          org_id: 'remodl',
          thread_id: context.thread_id,
          importance: 'high'
        }
      });

      const exceptionVector = {
        id: `training_exception_${exceptionRef.id}`,
        values: await generateDenseVector(exceptionContent),
        metadata: {
          type: 'training_exception',
          sequence_id: sequenceId,
          related_step: relatedStep,
          content: exceptionContent,
          content_display: `Exception to step ${relatedStep}: ${exceptionContent}`,
          instructional_content: exceptionContent,
          thread_id: context.thread_id,
          timestamp: new Date().toISOString(),
          sequence_title: sequence.data().title,
          sequence_description: sequence.data().description
        }
      };

      await queueVectorUpsert([exceptionVector], {
        namespace_type: 'remodl',
        content_type: 'training'
      });

      // Update sequence document
      await sequenceRef.update({
        exceptions: admin.firestore.FieldValue.arrayUnion({
          step_number: relatedStep,
          content: exceptionContent,
          added_at: admin.firestore.FieldValue.serverTimestamp()
        }),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      return { success: true, exceptionId: exceptionRef.id };
    } catch (error) {
      console.error('Error adding training exception:', error);
      throw error;
    }
  },

  // Add completion function
  completeSequence: async (sequenceId, context) => {
    try {
      const sequenceRef = admin.firestore().collection('training_sequences').doc(sequenceId);
      const sequence = await sequenceRef.get();
      
      if (!sequence.exists) {
        throw new Error(`Training sequence ${sequenceId} not found`);
      }

      const sequenceData = sequence.data();
      const subjectKey = await generateSubjectKey({
        type: 'training_sequence',
        subject: sequenceId,
        org_id: 'remodl'
      });

      // Create completion memory
      const completionRef = admin.firestore().collection('structured_memories').doc();
      await completionRef.set({
        type: 'training_step',
        content: `Training sequence "${sequenceData.title}" completed with ${sequenceData.current_step} steps`,
        content_display: `Training sequence completed: ${sequenceData.title}`,
        sequence_context: {
          sequence_id: sequenceId,
          step_number: sequenceData.current_step,
          total_steps: sequenceData.current_step,  // Set final count
          is_complete: true,
          is_exception: false,
          related_step: null
        },
        progressive_tracking: {
          subject_key: subjectKey,
          is_latest: true,
          version: 1,
          version_chain: [],
          previous_version: null,
          next_version: null
        },
        metadata: {
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
          org_id: 'remodl',
          thread_id: context.thread_id,
          importance: 'high'
        }
      });

      const completionVector = {
        id: `training_completion_${sequenceId}`,
        values: await generateDenseVector(JSON.stringify({
          title: sequenceData.title,
          total_steps: sequenceData.current_step,
          status: 'completed',
          steps: await getSequenceSteps(sequenceId)
        })),
        metadata: {
          type: 'training_sequence',
          sequence_id: sequenceId,
          status: 'completed',
          total_steps: sequenceData.current_step,
          content: JSON.stringify({
            title: sequenceData.title,
            total_steps: sequenceData.current_step,
            status: 'completed',
            steps: await getSequenceSteps(sequenceId)
          }),
          content_display: `Training sequence completed: ${sequenceData.title} with ${sequenceData.current_step} steps`,
          instructional_content: await getSequenceSteps(sequenceId),
          thread_id: context.thread_id,
          timestamp: new Date().toISOString(),
          sequence_title: sequenceData.title,
          sequence_description: sequenceData.description
        }
      };

      await queueVectorUpsert([completionVector], {
        namespace_type: 'remodl',
        content_type: 'training'
      });

      // Update sequence document
      await sequenceRef.update({
        status: 'completed',
        total_steps: sequenceData.current_step,
        completed_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      return { success: true, completionId: completionRef.id };
    } catch (error) {
      console.error('Error completing training sequence:', error);
      throw error;
    }
  },

  // Add helper function to get all steps in a sequence
  getSequenceSteps: async (sequenceId) => {
    const stepsQuery = await admin.firestore()
      .collection('structured_memories')
      .where('sequence_context.sequence_id', '==', sequenceId)
      .orderBy('sequence_context.step_number')
      .get();

    return stepsQuery.docs
      .map(doc => ({
        step: doc.data().sequence_context.step_number,
        content: doc.data().content,
        is_exception: doc.data().sequence_context.is_exception,
        related_step: doc.data().sequence_context.related_step
      }))
      .sort((a, b) => a.step - b.step);
  },

  // Add function to extract context from content
  extractTrainingContext: async (content) => {
    // Generate vector for content to find similar contexts
    const contentVector = await generateDenseVector(content);
    
    // Extract likely triggers and context from the content itself
    const contextualInfo = {
      triggers: [],
      content_types: new Set(),
      required_fields: new Set()
    };

    // Look for common patterns that indicate when this training applies
    if (content.toLowerCase().includes('when')) {
      const whenParts = content.split(/when|if/i);
      if (whenParts.length > 1) {
        // Extract triggers from "when" clauses
        contextualInfo.triggers = whenParts[1]
          .split(/[,.;]/)
          .map(part => part.trim())
          .filter(part => part.length > 0);
      }
    }

    // Identify content types from context
    const typePatterns = {
      project: /project|renovation|construction|build/i,
      workorder: /work order|repair|maintenance|service/i,
      property: /property|house|building|apartment|home/i,
      document: /document|contract|agreement|proposal/i
    };

    Object.entries(typePatterns).forEach(([type, pattern]) => {
      if (pattern.test(content)) {
        contextualInfo.content_types.add(type);
      }
    });

    return {
      context_triggers: Array.from(new Set(contextualInfo.triggers)),
      context_requirements: {
        content_types: Array.from(contextualInfo.content_types),
        required_fields: Array.from(contextualInfo.required_fields)
      }
    };
  }
}; 