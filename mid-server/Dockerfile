FROM ubuntu:14.04

LABEL maintainer Tools Management <tools_management@proservia.fr>

# To get rid of error messages like "debconf: unable to initialize frontend: Dialog":
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections

ADD asset/* /opt/

RUN apt-get -q update && apt-get install -qy unzip \
  supervisor \
  software-properties-common \
  wget && \
  apt-get upgrade -y && \
  add-apt-repository ppa:webupd8team/java -y && \
  apt-get update && \
  echo oracle-java7-installer shared/accepted-oracle-license-v1-1 select true | /usr/bin/debconf-set-selections && \
  apt-get install -y oracle-java8-installer && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

RUN wget --quiet --no-check-certificate \
  https://install.service-now.com/glide/distribution/builds/package/mid/2018/12/04/mid.kingston-10-17-2017__patch12-11-28-2018_12-04-2018_0932.linux.x86-64.zip \
  -O /tmp/mid.zip && \
  unzip -d /opt /tmp/mid.zip && \
  mv /opt/agent/config.xml /opt/ && \
  chmod 755 /opt/init && \
  rm -rf /tmp/*

EXPOSE 80 443

ENTRYPOINT ["/opt/init"]
CMD ["mid:start"]
