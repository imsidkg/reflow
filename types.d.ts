interface UserCredentials {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}
interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}
