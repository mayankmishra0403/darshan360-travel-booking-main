import { useAuth } from '../context/auth';

export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold my-4">Profile</h1>
      <div className="border rounded p-4 bg-white">
        <div><span className="font-semibold">Name:</span> {user.name}</div>
        <div><span className="font-semibold">Email:</span> {user.email}</div>
        <div><span className="font-semibold">User ID:</span> {user.$id}</div>
      </div>
    </div>
  );
}
