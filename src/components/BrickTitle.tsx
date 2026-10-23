const COLORS = ['#e5484d', '#f2b134', '#3fc1a0', '#5b8def'];

// The game title, with each letter sitting on its own beveled brick.
export default function BrickTitle({ text }: { text: string }) {
  const words = text.split(' ');
  let i = 0;
  return (
    <h1 className="brick-title" aria-label={text}>
      {words.map((word) => (
        <span className="brick-title__row" key={word} aria-hidden="true">
          {word.split('').map((ch) => {
            const color = COLORS[i++ % COLORS.length];
            return (
              <span className="brick-title__brick" style={{ background: color }} key={i}>
                {ch}
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}
