import { FAULT_LABEL, formatRate, VERDICT_LABEL, VERDICT_TONE } from '../../lib/format';
import { comparisonRows } from './model';

export function CompareTable({ repetitions, seed }: { repetitions: number; seed: number }) {
  const rows = comparisonRows(repetitions, seed);
  return (
    <div className="tablewrap">
      <table id="cmp">
        <caption className="sr-only">
          Seeded comparison of pre-fix and fixed builds at {repetitions} trials and seed {seed}
        </caption>
        <thead>
          <tr>
            <th scope="col">Fault</th>
            <th scope="col">Pre-fix</th>
            <th scope="col">Fixed</th>
            <th scope="col">Verdicts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.fault}>
              <td>{FAULT_LABEL[row.fault]}</td>
              <td>
                {formatRate(row.buggy.failureRate)} · {row.buggy.failureCount}/{row.buggy.repetitions}
              </td>
              <td>
                {formatRate(row.fixed.failureRate)} · {row.fixed.failureCount}/{row.fixed.repetitions}
              </td>
              <td>
                <span className={`chip ${VERDICT_TONE[row.buggy.verdict]}`}>
                  {VERDICT_LABEL[row.buggy.verdict]}
                </span>
                <span className={`chip ${VERDICT_TONE[row.fixed.verdict]}`}>
                  {VERDICT_LABEL[row.fixed.verdict]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
