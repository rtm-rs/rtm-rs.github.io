# ramets.org

![ci](https://github.com/taqtiqa/rtm-rs.org/workflows/ci/badge.svg)

The official RTM website.

## Build Instructions

1. Install [podman](https://podman.io)
2. `podman pull ghcr.io/getzola/zola:v0.15.1`
3. Build

   ```bash
   pushd source
     podman stop rtm-site
     podman rm rtm-site
     podman run --volume $PWD:/app \
                --workdir /app \
                ghcr.io/getzola/zola:v0.15.1 build
   popd
   ```

4. Serve

   ```bash
   pushd source
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
   popd
   ```
