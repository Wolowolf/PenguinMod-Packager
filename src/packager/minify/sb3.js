// Desktop fork (section 306): the id pool (shortest new ids for the most used ids) is the VM's
import compress from 'scratch-vm/src/serialization/tw-compress-sb3';
const {Pool} = compress;

const optimizeSb3Json = (projectData) => {
  // Note: we modify projectData in-place

  // Scan global attributes of the project so we can generate optimal IDs later
  const blockPool = new Pool();

  for (const target of projectData.targets) {
    for (const [blockId, block] of Object.entries(target.blocks)) {
      blockPool.addReference(blockId);
      if (Array.isArray(block)) {
        continue;
      }

      if (block.parent) {
        blockPool.addReference(block.parent);
      }
      if (block.next) {
        blockPool.addReference(block.next);
      }

      for (const input of Object.values(block.inputs)) {
        for (let i = 1; i < input.length; i++) {
          const inputValue = input[i];
          if (typeof inputValue === 'string') {
            blockPool.addReference(inputValue);
          }
        }
      }
    }
  }

  blockPool.generateNewIds();

  if (projectData.monitors) {
    for (const monitor of projectData.monitors) {
      // Remove redundant monitor values
      monitor.value = Array.isArray(monitor.value) ? [] : 0;
    }
  }

  // Use gathered data to optimize the project
  for (const target of projectData.targets) {
    const newBlocks = {};
    const newComments = {};

    for (const [blockId, block] of Object.entries(target.blocks)) {
      newBlocks[blockPool.getNewId(blockId)] = block;
      if (Array.isArray(block)) {
        continue;
      }

      if (block.parent) {
        block.parent = blockPool.getNewId(block.parent);
      }
      if (block.next) {
        block.next = blockPool.getNewId(block.next);
      }

      for (const input of Object.values(block.inputs)) {
        for (let i = 1; i < input.length; i++) {
          const inputValue = input[i];
          if (typeof inputValue === 'string') {
            input[i] = blockPool.getNewId(inputValue);
          }
        }
      }
      if (!block.shadow) {
        delete block.shadow;
      }
      if (!block.topLevel) {
        delete block.topLevel;
      }
      delete block.x;
      delete block.y;
      delete block.comment;
    }
    for (const [commentId, comment] of Object.entries(target.comments)) {
      const text = comment.text;
      const isSpecial = text.includes(' // _twconfig_') || text.includes(' // _gamepad_');
      if (isSpecial) {
        newComments[commentId] = comment;
      }
    }

    target.blocks = newBlocks;
    target.comments = newComments;
  }

  // Remove unnecessary metadata
  if (projectData.meta) {
    delete projectData.meta.agent;
    delete projectData.meta.vm;
  }

  return projectData;
};

export default optimizeSb3Json;
