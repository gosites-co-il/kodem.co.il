const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333/api';

async function getWorkspaces() {
  return [];
}

export default async function HomePage() {
  return (
    <main style={{ fontFamily: 'system-ui', maxWidth: 720, margin: '0 auto', padding: '2rem' }}>
      <h1>Kodem</h1>
      <p>Thin UI layer — all business logic lives in the API and engines.</p>
      <section>
        <h2>Product areas</h2>
        <ul>
          <li>CRM</li>
          <li>Insights</li>
          <li>Digital Card</li>
          <li>Dashboard</li>
        </ul>
      </section>
      <p>
        API: <code>{API_URL}</code>
      </p>
    </main>
  );
}
