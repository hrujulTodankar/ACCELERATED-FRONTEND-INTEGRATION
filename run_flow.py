import subprocess
import os
import time

# Start the mock server in the background
mock_server_process = subprocess.Popen(
    ["node", "scripts/mock_bhiv_server.cjs"],
    env={**os.environ, "PORT": "8001"}
)

# Wait for the server to start
time.sleep(3)

# Run the flow script
flow_script_process = subprocess.run(["node", "scripts/run_real_flow.js"])

# Kill the mock server
mock_server_process.kill()
