export type SpeakerType =
  | "presenter"
  | "keynote";

export interface PresenterScreenshot {
  url: string;
  path: string;
}

export interface Presenter {
  id: string;

  // Presenter information
  name: string;
  role: string;
  category: string;
  biography: string;

  // Speaker classification
  speakerType: SpeakerType;

  // Project / presentation information
  topic: string;
  projectDescription: string;
  projectUrl: string;

  // Presenter profile image
  imageUrl: string;
  imagePath: string;

  // Project screenshots
  screenshots: PresenterScreenshot[];

  // External profile
  linkedinUrl: string;

  // Display controls
  order: number;
  published: boolean;
}