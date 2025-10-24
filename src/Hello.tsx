export default function Hello({ name = "" }: { name?: string }) {
  return <h2>Hello, {name} 👋</h2>;
}
