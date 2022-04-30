# Dockerfile

FROM ghcr.io/getzola/zola:v0.15.1

WORKDIR /rtm

EXPOSE 4567
EXPOSE 1234

# Copy Ruby and Node dependencies
COPY Gemfile Gemfile.lock package.json package-lock.json ./

RUN gem install bundler:2.2.3 && \
    curl -sL https://deb.nodesource.com/setup_13.x -o nodesource_setup.sh  && \
    bash nodesource_setup.sh && \
    apt install nodejs

# Install dependencies
RUN bundle config set --local without 'debug' && \
    bundle install && \
    npm install

CMD bundle exec rake projects:symlink && bundle exec middleman server
