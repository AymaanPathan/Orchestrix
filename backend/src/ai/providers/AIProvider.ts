export interface AIProvider {
  generateWorkflow(prompt: string, system: string): Promise<string>;
}
