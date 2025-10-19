export default function Hello({ name = "Ron" }: { name?: string }) {
  return <h2>Hello, {name} 👋</h2>;
}
