import type { SPCC_t } from './common.ts';

declare global {
    interface Window {
        SPCC: SPCC_t;
    }
}
