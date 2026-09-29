export interface StaffMember {
  id: string;

  name: string;
  title: string;
  position: string;

  specialization: string;
  biography: string;

  imageUrl: string;
  imagePath: string;

  profileUrl: string;
  email: string;

  order: number;
  published: boolean;
}