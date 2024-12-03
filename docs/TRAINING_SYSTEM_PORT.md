# Training System Port Documentation

## Overview
This document tracks the porting of Sam's training system from Firebase Cloud Functions to the LiveKit Assistant LLM.

## Source Files
- `training_sequence.js` - Tool definition and handler
- `trainingSequenceFactory.js` - Core training functionality
- `trainingSequenceInstructions.js` - Sam's training behavior instructions

## Port Checklist

### 1. Tool Definition & Handler
- [x] Copy exact tool definition from training_sequence.js
- [ ] Implement handler with all actions:
  - [ ] init
  - [ ] add_step
  - [ ] add_exception
  - [ ] complete
  - [ ] ask_clarification
  - [ ] request_example
  - [ ] propose_example
  - [ ] validate_example
  - [ ] store_example
  - [ ] find_related_training
  - [ ] confirm_existing_training
  - [ ] suggest_training_merge
  - [ ] request_training_diff
  - [ ] reject_existing_training
  - [ ] suggest_new_training
  - [ ] request_visual_example
  - [ ] request_documentation
  - [ ] store_training_asset
- [ ] Add tool instructions

### 2. Factory Implementation
- [ ] Port trainingSequenceFactory.js methods:
  - [ ] initSequence
  - [ ] addStep
  - [ ] addException
  - [ ] completeSequence
  - [ ] handleClarification
  - [ ] findRelatedTraining
  - [ ] confirmExistingTraining
  - [ ] updateTrainingRelationships
- [ ] Port helper functions:
  - [ ] getSequenceSteps
  - [ ] extractTrainingContext
  - [ ] calculateVectorSimilarity

### 3. Supporting Services
- [ ] FirestoreClient
  - [ ] Collection management
  - [ ] Batch operations
  - [ ] Transaction support
- [ ] PineconeClient
  - [ ] Vector storage
  - [ ] Namespace management
  - [ ] Query operations
- [ ] QueueHandler
  - [ ] Vector upsert queue
  - [ ] Memory storage queue
  - [ ] Training operations queue
- [ ] ProgressiveMemoryFactory
  - [ ] Version chains
  - [ ] Relationship tracking
  - [ ] Context management

## Implementation Notes

### Training Hierarchy
- CORE: Password protected, fundamental knowledge
- ORG_CORE: Default for new training sequences
- CONTEXTUAL: Extends existing training with specific cases

### Progressive Memory
- Tracks version chains
- Manages relationships between training
- Handles context and triggers
- Stores in appropriate namespace

### Queue System
- Vector operations queued
- Memory storage queued
- Training operations real-time

## Files to Create
- [ ] src/tools/training.ts
- [ ] src/tools/handlers/training.ts
- [ ] src/memory/factories/TrainingSequenceFactory.ts
- [ ] src/memory/factories/ProgressiveMemoryFactory.ts
- [ ] src/memory/services/FirestoreClient.ts
- [ ] src/memory/services/PineconeClient.ts
- [ ] src/memory/services/QueueHandler.ts 