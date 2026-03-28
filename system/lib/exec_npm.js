import { exec } from 'child_process'

const blocked = [
    "rm -rf /",
    "rm -rf *",
    "rm --no-preserve-root -rf /",
    "mkfs.ext4",
    "dd if=",
    "chmod 777 /",
    "chown root:root /",
    "mv /",
    "cp /",
    "shutdown",
    "reboot",
    "poweroff",
    "halt",
    "kill -9 1",
    ">:(){ :|: & };:",
];

export async function execNpm(cmd, options = {}) {
    if (!cmd) throw new Error("No command provided");

    // Check for blocked commands
    if (blocked.some((b) => cmd.startsWith(b))) {
        throw new Error("Command blocked for security reasons.");
    }

    const flags = {
        cwd: options.cwd || process.cwd(),
        env: { ...process.env, ...options.env },
        timeout: options.timeout || 0, // 0 = no timeout
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    };

    // Parse flags from command string (simple parser)
    // Note: In a real implementation, we might want to strip these from the cmd string passed to exec
    // But for now, we assume cmd is the raw command string and options are passed separately or pre-parsed.
    // If we want to support --cwd in the command string itself like the snippet:
    
    let cleanCmd = cmd;
    const re = /--(\w+)(?:=(.+?))?(?:\s+|$)/g;
    let match;
    while ((match = re.exec(cmd)) !== null) {
        const [all, f, v] = match;
        if (f === "cwd") flags.cwd = v;
        else if (f === "env") {
            const [k, val] = v.split("=");
            flags.env[k] = val;
        } else if (f === "timeout") {
            flags.timeout = parseInt(v);
        }
        cleanCmd = cleanCmd.replace(all, "");
    }
    
    cleanCmd = cleanCmd.trim();

    return new Promise((resolve, reject) => {
        exec(cleanCmd, flags, (error, stdout, stderr) => {
            // We resolve even on error to return stdout/stderr
            resolve({
                error,
                stdout: stdout ? stdout.toString() : "",
                stderr: stderr ? stderr.toString() : "",
                cmd: cleanCmd,
                cwd: flags.cwd
            });
        });
    });
}
