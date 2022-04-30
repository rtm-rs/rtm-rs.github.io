[actions]: https://github.com/taqtiqa/ramets.org/actions

# ramets.org

![ci](https://github.com/taqtiqa/ramets.org/workflows/ci/badge.svg)

The official Ramets website.

## Systemd Instructions

1. Install [podman](https://podman.io)
2. `podman build --tag ramets.org ./`
3. Copy systemd service files to the local user profile

   ```bash
   cp -f *.service ~/.config/systemd/user/
   systemctl --user daemon-reload
   systemctl --user enable pod-ramets.org.service
   systemctl --user restart pod-ramets.org.service
   ```

4. Browse to `http://localhost:1234`
5. Verify systemd and podman status:

   ```bash
   systemctl --user status pod-ramets.org.service
   podman ps
   ```

## Container Instructions

1. Install [podman](https://podman.io)
2. `podman pull ghcr.io/getzola/zola:v0.15.1`
3. Build

   ```bash
   podman stop rtm-site
   podman rm rtm-site
   podman run --volume $PWD:/app \
              --workdir /app \
              ghcr.io/getzola/zola:v0.15.1 build
   ```

4. Serve

   ```bash
   podman stop rtm-site
   podman rm rtm-site
   podman run --volume $PWD:/app \
              --workdir /app \
              --publish 1111:1111 \
              --restart=always \
              --name=rtm-site \
              ghcr.io/getzola/zola:v0.15.1 serve --interface 0.0.0.0 \
                                                 --port 1111 \
                                                 --base-url localhost
   podman run --volume .:/rtm --volume node_modules:/app/node_modules  --publish 4567:4567 --publish 1234:1234 ramets.org
   ```

## Localhost Build Instructions

1. Install gem dependencies:

   ```shell
   bundle install
   ```

2. Install node dependencies:

   ```shell
   npm install
   ```

3. Clone and symlink docsites from individual Ramets repositories:

```bash
bundle exec rake projects:symlink
```

4. Serve locally at [http://localhost:4567](http://localhost:4567):

   ```shell
   bundle exec middleman server
   ```

   or build to `/docs`:

   ```shell
   bundle exec middleman build
   ```

## Windows Instructions

If you're getting the following error:

```
Unable to load the EventMachine C extension; To use the pure-ruby reactor, require 'em/pure_ruby'
```

or features such as Live Reload are not working then it's because the
C extension for eventmachine needs to be installed.

```
gem uninstall eventmachine
```

take note of the version being used. (At the time of writing '1.2.0.1')

```
gem install eventmachine -v '[VERSION]' --platform=ruby
```

If you have a proper environment with DevKit installed then eventmachine with its
C extension will be installed and everything will work fine.

## Create Local ramets.org Configuration Files

To create systemd files to provision a pod and container that serves the
development version of the website:

```bash
podman pod create --name ramets.org -p 4567:4567 -p 1234:1234
podman build --tag ramets.org ./
podman run \
            --volume .:/app \
            --volume node_modules:/app/node_modules \
            --detach \
            --restart=always \
            --pod=ramets.org \
            --name=web \
            ramets.org
podman generate kube -s -f ramets.org.yaml
podman generate systemd --new \
            --name \
            --files \
            --restart-policy no \
            ramets.org
```

to clean up:

```bash
podman pod stop ramets.org
podman pod rm ramets.org
```
