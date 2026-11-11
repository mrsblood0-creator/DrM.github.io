import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const bundled=path.join(os.homedir(),'.cache','codex-runtimes','codex-primary-runtime','dependencies','python','python.exe');
const python=process.env.PYTHON || (fs.existsSync(bundled)?bundled:'python');
const result=spawnSync(python,['scripts/optimize-images.py'],{stdio:'inherit'});
if(result.error)throw result.error;
process.exit(result.status??1);
