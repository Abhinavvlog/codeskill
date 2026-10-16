# PM2.io monitoring

Both applications include PM2 as a production dependency and expose `npm run prod:start`. Production backend and frontend Docker images use that script to run their existing Node.js applications under the locally installed `pm2-runtime`. Systemd continues to manage the containers. The runtime links automatically using `PM2_SECRET_KEY`, `PM2_PUBLIC_KEY`, and a unique `PM2_MACHINE_NAME` supplied at boot.

Credentials are read from the SSM SecureString named by `pm2_io_parameter_name` (default `/codeskill-prod/monitoring/pm2`). Terraform stores only the parameter name. The frontend instance role receives read permission for that parameter; the backend already has SSM parameter access. No inbound monitoring port is needed; allow outbound HTTPS.

## Provision and deploy

The supplied keys have been prepared locally in `.env.pm2-ssm.json`, ignored by Git and restricted to the file owner. From the repository root, provision them using your deployment AWS profile:

```bash
AWS_REGION=ap-south-1 bash scripts/configure-pm2-ssm.sh
```

Then build/push both updated Docker images and deploy their versioned tags with the normal production Terraform workflow. New instances retrieve the keys before starting their containers. Existing containers require a rollout using the updated images and user data; editing Terraform alone does not connect running processes.

Set `pm2_io_parameter_name = ""` to run PM2 Runtime without connecting to PM2.io. For a custom path, change `Name` in the ignored provisioning file to match the Terraform variable before provisioning.

On another workstation, create an owner-only `.env.pm2-ssm.json` with this schema and obtain the values from the PM2.io dashboard:

```json
{
  "Name": "/codeskill-prod/monitoring/pm2",
  "Type": "SecureString",
  "Value": "{\"PM2_SECRET_KEY\":\"YOUR_SECRET_KEY\",\"PM2_PUBLIC_KEY\":\"YOUR_PUBLIC_KEY\"}",
  "Overwrite": true
}
```

The older `modules/asg` host deployment also accepts `pm2_io_parameter_name`. When enabled, it retrieves the same keys and runs `pm2 link` as `ec2-user`, the owner of the application's PM2 daemon. It retains its existing PM2 installation, startup, log rotation, and process persistence.

Verify after rollout in the PM2.io dashboard: each frontend/backend instance should have a distinct name and its application process should appear. Docker image builds and actual dashboard connectivity must be checked in the deployment environment.
