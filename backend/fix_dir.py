import os
import shutil

root = r"c:\Users\AMAN\cynapse-platform"
bad_vault_file = os.path.join(root, "backend", "vault")
source_dir = os.path.join(root, "backend", "backend", "vault")
target_dir = os.path.join(root, "backend", "vault_new")

if os.path.isfile(bad_vault_file):
    os.remove(bad_vault_file)
    print(f"Removed bad vault file: {bad_vault_file}")

if not os.path.exists(target_dir):
    os.makedirs(target_dir)
    print(f"Created target dir: {target_dir}")

if os.path.exists(source_dir):
    for f in os.listdir(source_dir):
        shutil.move(os.path.join(source_dir, f), os.path.join(target_dir, f))
    print(f"Moved files from {source_dir} to {target_dir}")

# Rename target_dir to vault
final_dir = os.path.join(root, "backend", "vault")
if os.path.exists(final_dir):
    shutil.rmtree(final_dir)
os.rename(target_dir, final_dir)
print(f"Renamed {target_dir} to {final_dir}")

# Cleanup the extra backend
extra_backend = os.path.join(root, "backend", "backend")
if os.path.exists(extra_backend):
    shutil.rmtree(extra_backend)
    print(f"Removed extra backend: {extra_backend}")
