
export const getSystemInstructionKey = (moduleType: string): string => {
  // Use the new module-specific keys
  if (moduleType === 'k12') {
    return 'system_instructions_k12';
  } else {
    return 'system_instructions_post_secondary';
  }
};
