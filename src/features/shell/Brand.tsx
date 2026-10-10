import { Icon } from "@resilix/ui-components";
import styles from "./ShellStyles.module.css";
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className={styles.brand}>
      <span className={styles.brandIcon}>
        <Icon name="shield" width={25} height={25} />
      </span>
      {!compact && (
        <span>
          resilix<span className={styles.brandDot}>.</span>
        </span>
      )}
    </span>
  );
}
