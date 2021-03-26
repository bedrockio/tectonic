locals {
  global = {
    project          = var.project,
    region           = var.region,
    zone             = var.zone,
    environment      = var.environment,
    location         = "${var.region}-${var.zone}",
    bucket_prefix    = var.bucket_prefix,
    cluster_name     = var.cluster_name
  }
}

module "gke-cluster" {
  source = "../../../provisioning/gke-cluster-module"

  global = local.global
  preemptible = true
  node_pool_count = 2
}

module "gcp-buckets" {
  source = "../../../provisioning/gcp-bucket-module"

  global = local.global
}

resource "google_compute_disk" "mongo_disk" {
  name  = "tectonic-mongo-disk"
  type  = "pd-ssd"
  zone  = var.zone
  size  = 300
}

resource "google_compute_disk" "elasticsearch_disk" {
  name  = "tectonic-elasticsearch-disk"
  type  = "pd-ssd"
  zone  = var.zone
  size  = 300
}