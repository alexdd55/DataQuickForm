docker build --platform linux/amd64 -f Dockerfile.linux-build -t wails-linux-builder .
docker run --platform linux/amd64 --rm -v "$PWD:/src" -w /src wails-linux-builder
