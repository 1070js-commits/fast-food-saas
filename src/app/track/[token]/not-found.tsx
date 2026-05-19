export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Ticket introuvable</h1>
        <p className="text-gray-500">
          Le lien est peut-être expiré ou erroné.
        </p>
      </div>
    </main>
  );
}
