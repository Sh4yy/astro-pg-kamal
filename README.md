# Astro + Kamal + Postgres with S3 Backup

This is a simple Kamal example for an Astro application with Postgres and S3 backups. All you have to do is update the configuration and run `kamal deploy`.

You can also simply replace Astro with any other framework as long as you have a working Dockerfile with `curl` and a `/up` endpoint for health checks. You can also customize the health check to your needs. Check out [Kamal's documentation](https://kamal-deploy.org) for more information.

## Table of Contents

- [Important Notes](#important-notes)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Useful Commands](#useful-commands)
- [Backup and Restore](#backup-and-restore)

## Important Notes

This project is only responsible for the deployment of your application and does not handle any security concerns. Please consider following best practices and take security precautions before deploying to production.

- Use key-based authentication instead of password-based login.
- Disable root login and use a non-root user with sudo privileges.
- Change the default SSH port from 22 to something else.
- Use a firewall to control incoming and outgoing traffic.
- Set up your server behind Cloudflare to mitigate DDoS attacks.
- Configure rate limiting on your web server to prevent abuse.
- Keep your operating system and all installed software up to date.
- Enable automatic security updates when possible.

> This is not an exhaustive list of best practices, but a few common ones.

## Configuration

### Install Kamal

```bash
gem install kamal
```

### Update Environment Variables

```bash
cp .env.example .env
```

And update the variables as needed.

### Setup your SSH key in Kamal

This project is configured to use `~/.ssh/kamal` for SSH access. If you are using a different key, you should update `config/deploy.yml` and `.kamal/hooks/docker-setup` to match your key.

### Setup Kamal

```bash
kamal setup
```

### Push your environment variables to Kamal

```bash
kamal env push
```

> You need to run this command whenever you update your `.env` file.

## Deployment

The `deploy` command will build and deploy the application to the specified environment.

```bash
kamal deploy
```

## Useful Commands

### Accessory Commands

These commands are useful for managing the database and other accessories that are running.

- `kamal accessory boot [NAME]`: Boot new accessory service on host (use NAME=all to boot all accessories)
- `kamal accessory details [NAME]`: Show details about accessory on host (use NAME=all to show all accessories)
- `kamal accessory exec [NAME] [CMD]`: Execute a custom command on servers (use --help to show options)
- `kamal accessory logs [NAME]`: Show log lines from accessory on host (use --help to show options)
- `kamal accessory reboot [NAME]`: Reboot existing accessory on host (stop container, remove container, start new container)
- `kamal accessory remove [NAME]`: Remove accessory container, image and data directory from host (use NAME=all to remove all accessories)
- `kamal accessory restart [NAME]`: Restart existing accessory container on host
- `kamal accessory start [NAME]`: Start existing accessory container on host
- `kamal accessory stop [NAME]`: Stop existing accessory container on host

### App Commands

These commands are useful for managing the application that is running.

- `kamal app boot`: Boot app on servers (or reboot app if already running)
- `kamal app containers`: Show app containers on servers
- `kamal app details`: Show details about app containers
- `kamal app exec [CMD]`: Execute a custom command on servers within the app container (use --help to show options)
- `kamal app images`: Show app images on servers
- `kamal app logs`: Show log lines from app on servers (use --help to show options)
- `kamal app remove`: Remove app containers and images from servers
- `kamal app stale_containers`: Detect app stale containers
- `kamal app start`: Start existing app container on servers
- `kamal app stop`: Stop app container on servers
- `kamal app version`: Show app version currently running on servers

## Backup and Restore

For more information on using the backup and restore functionality, refer to [postgres-backup-s3](https://github.com/eeshugerman/postgres-backup-s3).

> **Important:** Thoroughly test the backup and restore functionality in a staging environment before deploying to production.

Ensure that:

- Backups are created successfully and stored in the specified S3 bucket
- Restoration process works as expected, recovering all data without errors
- The restored database is fully functional and contains all expected data

### Running on-demand backups

```bash
kamal accessory exec backups 'sh ./backup.sh' --reuse --verbose
```

### Restore from a backup

```bash
kamal accessory exec backups 'sh ./restore.sh' --reuse --verbose
```

### Restore from a specific backup

```bash
kamal accessory exec backups 'sh ./restore.sh <timestamp>' --reuse --verbose
```
