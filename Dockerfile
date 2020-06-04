# Package version for node docker container
FROM node:10.15.1

# Make a new directory within the docker container
WORKDIR /usr/src/smart-brain-api

# Copy in root directory all folders and files
COPY ./ ./

# Run the command to install  packages
RUN npm install

# Launch the docker build image and docker file can only have one docker command that comes at the end of the file.
CMD ["sh"]