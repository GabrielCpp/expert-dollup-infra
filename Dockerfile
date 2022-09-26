FROM hashicorp/http-echo
CMD [ "-text='hello world'", "-listen=:8080" ]