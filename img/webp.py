from subprocess import call
from glob import glob

for in_file_name in glob('*.jpg') + glob('*.png'):
    out_file_name = in_file_name.replace('jpg', 'webp').replace('png', 'webp')
    call(['cwebp', in_file_name, '-o', out_file_name])