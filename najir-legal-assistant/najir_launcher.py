# najir_launcher.py
import os
import subprocess
import time
import signal
import argparse
import sys
from concurrent.futures import ThreadPoolExecutor

# Define the components that need to be launched
COMPONENTS = {
    "adk_agent": {
        "command": ["python", "-m", "google.adk.server", "--agent", "revised_root_agent.najir_root_agent"],
        "cwd": "./",
        "env": {},
        "ready_message": "Agent server is running",
    },
    "web_server": {
        "command": ["node", "revised_chat_server.js"],
        "cwd": "./",
        "env": {},
        "ready_message": "Najir Legal Assistant API STARTED",
    },
    "frontend": {
        "command": ["npm", "start"],
        "cwd": "./najir-frontend",  # Assuming your React frontend is in this directory
        "env": {},
        "ready_message": "Compiled successfully!",
    }
}

# Running processes
processes = {}
stop_flag = False

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Najir Legal Assistant System Launcher")
    parser.add_argument("--components", nargs="+", choices=list(COMPONENTS.keys()) + ["all"],
                       default=["all"], help="Components to launch")
    parser.add_argument("--debug", action="store_true", help="Enable debug output")
    return parser.parse_args()

def signal_handler(sig, frame):
    """Handle termination signals."""
    global stop_flag
    print("\n\033[93mShutting down Najir system...\033[0m")
    stop_flag = True
    stop_all_processes()

def start_process(name, config):
    """Start a single component process."""
    try:
        # Prepare environment
        env = os.environ.copy()
        env.update(config.get("env", {}))
        
        # Start the process
        print(f"\033[94mStarting {name}...\033[0m")
        process = subprocess.Popen(
            config["command"],
            cwd=config.get("cwd", "./"),
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
        
        processes[name] = process
        
        # Monitor the process output
        ready = False
        while process.poll() is None and not stop_flag:
            line = process.stdout.readline().strip()
            if not line:
                continue
                
            # Print the output with color coding
            if "error" in line.lower() or "exception" in line.lower():
                print(f"\033[91m[{name}] {line}\033[0m")
            elif "warning" in line.lower():
                print(f"\033[93m[{name}] {line}\033[0m")
            elif config["ready_message"] in line and not ready:
                ready = True
                print(f"\033[92m[{name}] Component is ready!\033[0m")
            else:
                print(f"\033[96m[{name}] {line}\033[0m")
                
        # Check if process exited unexpectedly
        if process.poll() is not None and not stop_flag:
            exit_code = process.poll()
            print(f"\033[91m[{name}] Process exited unexpectedly with code {exit_code}\033[0m")
            return False
            
        return True
    
    except Exception as e:
        print(f"\033[91m[{name}] Failed to start: {str(e)}\033[0m")
        return False

def stop_process(name):
    """Stop a single component process."""
    if name in processes and processes[name]:
        process = processes[name]
        if process.poll() is None:  # If still running
            print(f"\033[93mStopping {name}...\033[0m")
            try:
                process.terminate()
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                print(f"\033[91mForce killing {name}...\033[0m")
                process.kill()

def stop_all_processes():
    """Stop all running processes."""
    for name in list(processes.keys()):
        stop_process(name)

def main():
    """Main entry point for the launcher."""
    args = parse_args()
    
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Determine which components to launch
    components_to_launch = list(COMPONENTS.keys()) if "all" in args.components else args.components
    
    print("\033[95m" + "="*50 + "\033[0m")
    print("\033[95m   Najir Legal Assistant System Launcher   \033[0m")
    print("\033[95m" + "="*50 + "\033[0m")
    print(f"\033[94mLaunching components: {', '.join(components_to_launch)}\033[0m")
    
    # Start all the components in parallel
    with ThreadPoolExecutor(max_workers=len(components_to_launch)) as executor:
        futures = {
            name: executor.submit(start_process, name, COMPONENTS[name])
            for name in components_to_launch
        }
        
        # Wait for processes to finish or be interrupted
        try:
            while any(not future.done() for future in futures.values()) and not stop_flag:
                time.sleep(0.1)
        except KeyboardInterrupt:
            signal_handler(signal.SIGINT, None)
    
    print("\033[95mNajir system shutdown complete.\033[0m")

if __name__ == "__main__":
    main()