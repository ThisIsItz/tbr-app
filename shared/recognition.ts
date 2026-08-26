export type RecognitionConfidence = 'low' | 'medium' | 'high';

export interface BookGuess {
  title: string;
  author: string | null;
  confidence: RecognitionConfidence;
}
