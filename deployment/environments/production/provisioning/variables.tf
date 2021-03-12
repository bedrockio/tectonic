## These variables are set in the ./deployment/scripts/provision script with env values
## from ./deployment/environments/<environment>/.env

variable "project" {
  default = "tectonic"
}

variable "environment" {
  default = "staging"
}

variable "region" {
  default = "us-east1"
}

variable "zone" {
  default = "c"
}

variable "bucket_prefix" {
  default = "tectonic_production"
}

variable "cluster_name" {
  default = "cluster-1"
}
