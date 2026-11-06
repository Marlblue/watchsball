"""Render sprite bola Watchsball dengan Blender (headless).

Pakai:
  blender --background --factory-startup --python tools/render_balls.py -- <folder_output> [tipe1,tipe2,...]

Hasil per bola: <tipe>.webp = grid COLS kolom berisi FRAMES frame (SIZE x SIZE), bola diputar 360 derajat searah jarum jam dilihat dari atas (frame 0 = posisi awal model).
Plus samurai_blade.webp = sprite katana tampak atas (mengarah ke +X).
Skala: bola radius 1 unit, ortho_scale = SCALE unit, jadi ukuran sprite = SCALE * radius bola di game.
"""
import bpy
import math
import os
import sys

import numpy as np

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = os.path.abspath(argv[0] if argv else "balls_out")
ONLY = argv[1].split(",") if len(argv) > 1 and argv[1] else None
FRAMES = 32  # sudut putar per frame = 360/32; disusun grid COLS kolom
COLS = 8
SIZE = 192
SCALE = 3.0  # lebar frame dalam unit; bola radius 1
TILT = math.radians(30)

os.makedirs(OUT, exist_ok=True)
import tempfile
TMP = tempfile.mkdtemp(prefix="watchsball_frames_")  # frame mentah di luar folder deploy


# ---------------------------------------------------------------- scene
def reset_world(scene, color=(0.03, 0.03, 0.045, 1.0), strength=0.5):
    world = scene.world or bpy.data.worlds.new("WLD-main")
    scene.world = world
    world.use_nodes = True
    nodes = world.node_tree.nodes
    for n in list(nodes):
        nodes.remove(n)
    out = nodes.new("ShaderNodeOutputWorld")
    bg = nodes.new("ShaderNodeBackground")
    bg.inputs["Color"].default_value = color
    bg.inputs["Strength"].default_value = strength
    world.node_tree.links.new(bg.outputs["Background"], out.inputs["Surface"])


def setup_scene():
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = SIZE
    scene.render.resolution_y = SIZE
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    try:
        scene.eevee.taa_render_samples = 48
    except AttributeError:
        pass
    reset_world(scene)

    cam_data = bpy.data.cameras.new("CAM-sprite")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = SCALE
    cam = bpy.data.objects.new("CAM-sprite", cam_data)
    d = 10
    cam.location = (0, -d * math.sin(TILT), d * math.cos(TILT))
    cam.rotation_euler = (TILT, 0, 0)
    scene.collection.objects.link(cam)
    scene.camera = cam

    def area(name, loc, energy, size, color=(1, 1, 1)):
        ld = bpy.data.lights.new(name, "AREA")
        ld.energy = energy
        ld.shape = "DISK"  # pantulan bulat, bukan kotak
        ld.size = size
        ld.color = color
        lo = bpy.data.objects.new(name, ld)
        lo.location = loc
        # arahkan ke origin
        direction = -np.array(loc, dtype=float)
        rot_quat = __import__("mathutils").Vector(direction).to_track_quat("-Z", "Y")
        lo.rotation_euler = rot_quat.to_euler()
        scene.collection.objects.link(lo)
        return lo

    area("LGT-key", (-3.5, -3.0, 5.0), 900, 3.0, (1.0, 0.96, 0.9))
    area("LGT-fill", (4.0, -2.5, 2.5), 180, 4.0, (0.75, 0.85, 1.0))
    area("LGT-rim", (0.5, 5.0, 2.0), 700, 2.5, (0.85, 0.9, 1.0))
    return scene


# ---------------------------------------------------------------- material helpers
def set_input(node, name, value):
    for s in node.inputs:
        if s.name == name:
            s.default_value = value
            return True
    return False


def principled(name, color, rough=0.4, metal=0.0, coat=0.0, emis=None, emis_str=0.0, transmission=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    set_input(bsdf, "Base Color", (*color, 1.0))
    set_input(bsdf, "Roughness", rough)
    set_input(bsdf, "Metallic", metal)
    set_input(bsdf, "Coat Weight", coat)
    set_input(bsdf, "Coat Roughness", 0.08)
    if transmission:
        set_input(bsdf, "Transmission Weight", transmission)
        set_input(bsdf, "IOR", 1.31)
    if emis:
        set_input(bsdf, "Emission Color", (*emis, 1.0))
        set_input(bsdf, "Emission Strength", emis_str)
    return mat, nt, bsdf


def node(nt, kind, **props):
    n = nt.nodes.new(kind)
    for k, v in props.items():
        setattr(n, k, v)
    return n


def obj_coords(nt):
    tc = node(nt, "ShaderNodeTexCoord")
    sep = node(nt, "ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], sep.inputs[0])
    return tc, sep


def math_node(nt, op, a=None, b=None):
    m = node(nt, "ShaderNodeMath", operation=op)
    for i, v in enumerate((a, b)):
        if v is None:
            continue
        if isinstance(v, (int, float)):
            m.inputs[i].default_value = v
        else:
            nt.links.new(v, m.inputs[i])
    return m.outputs[0]


def mix_color(nt, fac, c1, c2, target):
    mx = node(nt, "ShaderNodeMix", data_type="RGBA")
    nt.links.new(fac, mx.inputs["Factor"])
    mx.inputs["A"].default_value = (*c1, 1.0)
    mx.inputs["B"].default_value = (*c2, 1.0)
    nt.links.new(mx.outputs["Result"], target)
    return mx


def add_bump(nt, bsdf, height_socket, strength=0.3):
    bump = node(nt, "ShaderNodeBump")
    bump.inputs["Strength"].default_value = strength
    nt.links.new(height_socket, bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])


# ---------------------------------------------------------------- geometry helpers
def sphere(name, r=1.0, loc=(0, 0, 0), seg=64, rings=32):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, radius=r, location=loc)
    o = bpy.context.active_object
    o.name = name
    bpy.ops.object.shade_smooth()
    return o


def cone(name, r1, depth, loc, direction):
    import mathutils
    bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=r1, radius2=0.0, depth=depth, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.rotation_euler = mathutils.Vector(direction).to_track_quat("Z", "Y").to_euler()
    bpy.ops.object.shade_smooth()
    return o


def assign(o, mat):
    o.data.materials.clear()
    o.data.materials.append(mat)


def parent_to(children, root):
    for c in children:
        c.parent = root


def new_root(name):
    root = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(root)
    return root


# ---------------------------------------------------------------- bahan dari versi lama (dipakai Golem & Penyihir Kosmos)
def build_batu():
    mat, nt, b = principled("MAT-batu", (0.5, 0.44, 0.38), rough=0.95)
    vor = node(nt, "ShaderNodeTexVoronoi", feature="DISTANCE_TO_EDGE")
    vor.inputs["Scale"].default_value = 3.5
    noise = node(nt, "ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 12
    noise.inputs["Detail"].default_value = 10
    h = math_node(nt, "ADD", math_node(nt, "MULTIPLY", vor.outputs["Distance"], 2.0), math_node(nt, "MULTIPLY", noise.outputs["Fac"], 0.4))
    add_bump(nt, b, h, 0.8)
    mix_color(nt, noise.outputs["Fac"], (0.36, 0.32, 0.28), (0.62, 0.56, 0.48), b.inputs["Base Color"])
    s = sphere("GEO-ball", 0.97)
    tex = bpy.data.textures.new("TEX-rock", "VORONOI")
    tex.noise_scale = 0.7
    disp = s.modifiers.new("DSP-rock", "DISPLACE")
    disp.texture = tex
    disp.strength = 0.12
    assign(s, mat)
    return [s]


def build_lubang():
    mat, nt, b = principled("MAT-lubang", (0.0, 0.0, 0.0), rough=0.05, coat=1.0)
    lw = node(nt, "ShaderNodeLayerWeight")
    lw.inputs["Blend"].default_value = 0.35
    set_input(b, "Emission Color", (0.45, 0.2, 1.0, 1))
    em = math_node(nt, "MULTIPLY", lw.outputs["Facing"], 4.0)
    nt.links.new(em, b.inputs["Emission Strength"])
    s = sphere("GEO-ball", 0.9)
    assign(s, mat)
    disk, dnt, db = principled("MAT-accretion", (0.08, 0.03, 0.15), emis=(1.0, 0.45, 0.15), emis_str=0.9)
    wave = node(dnt, "ShaderNodeTexWave", wave_type="RINGS")
    wave.inputs["Scale"].default_value = 6
    wave.inputs["Distortion"].default_value = 3
    mix_color(dnt, wave.outputs["Fac"], (0.55, 0.2, 1.0), (1.0, 0.55, 0.2), db.inputs["Emission Color"])
    bpy.ops.mesh.primitive_torus_add(major_radius=1.15, minor_radius=0.16, location=(0, 0, 0))
    ring = bpy.context.active_object
    ring.scale = (1, 1, 0.25)
    ring.rotation_euler = (math.radians(18), 0, 0)
    bpy.ops.object.shade_smooth()
    assign(ring, disk)
    return [s, ring]


# ---------------------------------------------------------------- hero
# Aturan: bola = kepala/badan hero, "depan" (wajah) di +X dan wajahnya digambar 2D di game.
# Topi/helm di atas-belakang (-X, +Z), senjata di samping (+Y/-Y) atau punggung, supaya tidak menabrak wajah.
# Semua bagian di dalam radius ~1.45 (bingkai sprite = 3 unit).
import mathutils

V = mathutils.Vector
_MATS = {}


def M(name, color, rough=0.5, metal=0.0, coat=0.0, emis=None, es=0.0):
    """Material sederhana, di-cache per nama."""
    key = "MAT-" + name
    if key in _MATS and _MATS[key].name in bpy.data.materials:
        return _MATS[key]
    m = principled(key, color, rough, metal, coat, emis, es)[0]
    _MATS[key] = m
    return m


def _fin(o, name, mat, smooth=True):
    o.name = name
    if smooth:
        bpy.ops.object.shade_smooth()
    assign(o, mat)
    return o


def sph(name, r, loc, mat, scale=(1, 1, 1), rot=(0, 0, 0), seg=32):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, radius=r, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.scale = scale
    return _fin(o, name, mat)


def cyl(name, r, depth, loc, mat, rot=(0, 0, 0), scale=(1, 1, 1), verts=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.scale = scale
    return _fin(o, name, mat)


def cn(name, r1, r2, depth, loc, mat, rot=(0, 0, 0), scale=(1, 1, 1), verts=16):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=depth, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.scale = scale
    return _fin(o, name, mat)


def tor(name, R, r, loc, mat, rot=(0, 0, 0), scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, location=loc, rotation=rot, major_segments=40, minor_segments=12)
    o = bpy.context.active_object
    o.scale = scale
    return _fin(o, name, mat)


def box(name, size, loc, mat, rot=(0, 0, 0), bevel=0.02):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.scale = size
    if bevel:
        mod = o.modifiers.new("BEV", "BEVEL")
        mod.width = bevel / max(size)
        mod.segments = 2
    return _fin(o, name, mat, smooth=False)


def aim(direction):
    """Rotasi supaya sumbu Z lokal menghadap arah tertentu."""
    return V(direction).normalized().to_track_quat("Z", "Y").to_euler()


def on(d, dist=1.0):
    return tuple(V(d).normalized() * dist)


R_ = math.radians


def body(name, color, rough=0.45, metal=0.0, coat=0.35, pattern=None, c2=None, bump=0.05):
    """Bola dasar warna hero. pattern: None | 'belt' (sabuk di pinggang) | 'stripe' | 'noise'."""
    mat, nt, b = principled("MAT-" + name, color, rough, metal, coat)
    if pattern in ("belt", "stripe") and c2:
        _, sep = obj_coords(nt)
        if pattern == "belt":
            f = math_node(nt, "LESS_THAN", math_node(nt, "ABSOLUTE", math_node(nt, "ADD", sep.outputs["Z"], 0.25)), 0.12)
        else:
            f = math_node(nt, "LESS_THAN", math_node(nt, "ABSOLUTE", sep.outputs["Y"]), 0.12)
        mix_color(nt, f, color, c2, b.inputs["Base Color"])
    if pattern == "noise" and c2:
        noise = node(nt, "ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = 3.0
        noise.inputs["Detail"].default_value = 6
        ramp = node(nt, "ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].position = 0.45
        ramp.color_ramp.elements[1].position = 0.6
        nt.links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
        mix_color(nt, ramp.outputs["Color"], color, c2, b.inputs["Base Color"])
    n = node(nt, "ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = 30
    add_bump(nt, b, n.outputs["Fac"], bump)
    s = sphere("GEO-ball")
    assign(s, mat)
    return s


# ---- potongan umum
BACK = (-0.5, 0, 0.86)  # arah atas-belakang kepala


def helmet(color, metal=0.8, r=0.97, tilt=0.55, name="helm"):
    """Helm bundar menutup ubun-ubun dan belakang kepala."""
    m = M(name, color, 0.3, metal, 0.4)
    return sph("GEO-" + name, r, on(BACK, tilt), m, scale=(1, 1.04, 0.74))


def hood(color, name="hood"):
    m = M(name, color, 0.75)
    return sph("GEO-" + name, 1.0, (-0.34, 0, 0.2), m, scale=(1, 1.06, 1.0))


def headband(color, z=0.5, name="band", tails=True):
    m = M(name, color, 0.6)
    parts = [tor("GEO-" + name, 0.86, 0.07, (-0.05, 0, z), m, rot=(0, R_(-12), 0))]
    if tails:
        for sy in (-1, 1):
            parts.append(box("GEO-" + name + "t", (0.34, 0.08, 0.03), (-0.98, sy * 0.1, z - 0.18), m, rot=(R_(sy * 20), R_(35), 0)))
    return parts


def hair_spikes(color, n=7, length=0.5, name="hair", spread=1.0):
    m = M(name, color, 0.55, coat=0.2)
    parts = [sph("GEO-" + name + "cap", 1.0, (-0.3, 0, 0.18), m, scale=(1, 1.03, 1))]
    for i in range(n):
        a = -math.pi * 0.85 * spread + (i / max(1, n - 1)) * math.pi * 1.7 * spread
        d = V((-0.55 + 0.25 * math.cos(a), 0.55 * math.sin(a), 0.75)).normalized()
        parts.append(cn("GEO-" + name + "%d" % i, 0.22, 0.0, length, tuple(d * (1.0 + length * 0.45)), m, rot=aim(d + V((-0.3, 0, 0.3)))))
    return parts


def brim_hat(color, brim=1.05, crown_h=0.45, crown_r=0.55, tilt=-26, z=0.8, band=None, name="hat"):
    m = M(name, color, 0.6)
    rot = (0, R_(tilt), 0)
    brim = min(brim, 1.1)
    parts = [cyl("GEO-" + name + "b", brim, 0.06, (-0.38, 0, z), m, rot=rot),
             cyl("GEO-" + name + "c", crown_r, crown_h, (-0.5, 0, z + crown_h / 2), m, rot=rot)]
    if band:
        parts.append(cyl("GEO-" + name + "bd", crown_r * 1.02, 0.1, (-0.5, 0, z + 0.07), M(name + "band", band, 0.5), rot=rot))
    return parts


def wizard_hat(color, tip=None, name="wiz"):
    m = M(name, color, 0.6)
    parts = [cyl("GEO-" + name + "b", 1.18, 0.06, (-0.15, 0, 0.8), m, rot=(0, R_(-16), 0)),
             cn("GEO-" + name + "c", 0.62, 0.05, 1.0, (-0.45, 0, 1.2), m, rot=(0, R_(-38), 0))]
    if tip:
        parts.append(sph("GEO-" + name + "tip", 0.13, (-0.82, 0, 1.55), M(name + "tip", tip, 0.3, emis=tip, es=3)))
    return parts


def side_blade(color=(0.85, 0.88, 0.92), handle=(0.3, 0.15, 0.08), length=1.05, side=1, angle=35, width=0.09, name="blade"):
    """Pedang/golok di samping, ujung mengarah ke atas-belakang."""
    st = M(name, color, 0.25, 0.85)
    hd = M(name + "h", handle, 0.6)
    y = side * 1.02
    a = R_(angle)
    parts = [box("GEO-" + name, (width, 0.035, length), (-0.25 - math.sin(a) * length * 0.35, y, 0.15 + math.cos(a) * length * 0.3), st, rot=(0, -a, 0)),
             box("GEO-" + name + "g", (0.28, 0.08, 0.06), (-0.1, y, -0.12), hd, rot=(0, -a, 0)),
             cyl("GEO-" + name + "hd", 0.05, 0.3, (0.0, y, -0.3), hd, rot=(0, -a, 0))]
    return parts


def staff(color=(0.45, 0.28, 0.12), orb=None, side=1, name="staff"):
    m = M(name, color, 0.7)
    parts = [cyl("GEO-" + name, 0.05, 2.0, (-0.2, side * 1.08, 0.2), m, rot=(R_(side * -8), R_(-10), 0))]
    if orb:
        parts.append(sph("GEO-" + name + "o", 0.2, (-0.38, side * 1.18, 1.2), M(name + "o", orb, 0.2, emis=orb, es=4)))
    return parts


def gun(color=(0.25, 0.25, 0.3), length=0.9, side=1, barrels=1, name="gun"):
    m = M(name, color, 0.35, 0.7)
    wood = M(name + "w", (0.45, 0.25, 0.1), 0.6)
    y = side * 1.0
    parts = [box("GEO-" + name + "s", (0.4, 0.14, 0.2), (-0.15, y, -0.1), wood)]
    for i in range(barrels):
        parts.append(cyl("GEO-" + name + "%d" % i, 0.055, length, (0.25, y + (i - (barrels - 1) / 2) * 0.12, 0.0), m, rot=(0, R_(90), 0)))
    return parts


def shield_disc(face, rim, side=1, r=0.62, name="shield"):
    y = side * 1.05
    return [cyl("GEO-" + name, r, 0.1, (0.05, y, 0.05), M(name, face, 0.35, 0.5, 0.4), rot=(R_(90), 0, 0)),
            tor("GEO-" + name + "r", r, 0.06, (0.05, y + side * 0.02, 0.05), M(name + "r", rim, 0.3, 0.9), rot=(R_(90), 0, 0))]


def horns(color, size=0.8, name="horn"):
    m = M(name, color, 0.4, coat=0.5)
    parts = []
    for sy in (-1, 1):
        d = V((-0.25, sy * 0.8, 0.55)).normalized()
        parts.append(cn("GEO-" + name + "%d" % sy, 0.2, 0.0, size, tuple(d * 1.25), m, rot=aim(d + V((0, 0, 0.7)))))
    return parts


def wings(color, name="wing"):
    m = M(name, color, 0.5)
    parts = []
    for sy in (-1, 1):
        parts.append(sph("GEO-" + name + "%d" % sy, 0.42, (-0.35, sy * 0.95, 0.65), m, scale=(1.2, 0.12, 0.55), rot=(R_(sy * -25), R_(-25), 0)))
    return parts


def floater(name, r, loc, color, es=3.0, glass=False):
    m = M(name, color, 0.1 if glass else 0.3, coat=1.0 if glass else 0.0, emis=color, es=es)
    return sph("GEO-" + name, r, loc, m)


# ---- 50 hero
def h_ksatria():
    return [body("ksatria", (0.2, 0.4, 0.85), 0.35, 0.3, pattern="stripe", c2=(0.9, 0.75, 0.25)),
            helmet((0.78, 0.8, 0.86)), cn("GEO-plume", 0.18, 0.05, 0.6, (-0.55, 0, 1.32), M("plume", (0.9, 0.12, 0.15), 0.7), rot=(0, R_(-45), 0))] + shield_disc((0.2, 0.4, 0.85), (0.95, 0.78, 0.3))


def h_viking():
    return [body("viking", (0.85, 0.5, 0.18), 0.6), helmet((0.42, 0.36, 0.3), metal=0.6, name="vhelm")] + horns((0.95, 0.92, 0.82)) + \
        [cyl("GEO-axe", 0.04, 1.2, (-0.3, -1.05, 0.2), M("axeh", (0.4, 0.22, 0.1), 0.7), rot=(0, R_(-20), 0)),
         box("GEO-axeb", (0.4, 0.05, 0.32), (-0.48, -1.07, 0.72), M("axeb", (0.8, 0.82, 0.86), 0.25, 0.9), rot=(0, R_(-20), 0))]


def h_gladiator():
    gold = M("gladhelm", (0.95, 0.72, 0.25), 0.3, 0.9)
    return [body("gladiator", (0.75, 0.2, 0.15), 0.5, pattern="belt", c2=(0.4, 0.25, 0.1)),
            sph("GEO-gladhelm", 0.97, on(BACK, 0.55), gold, scale=(1, 1.04, 0.74)),
            box("GEO-crest", (0.95, 0.12, 0.3), (-0.3, 0, 1.15), M("crest", (0.9, 0.12, 0.12), 0.8), rot=(0, R_(-22), 0)),
            cyl("GEO-tri", 0.04, 1.9, (-0.1, 1.07, 0.3), M("trih", (0.5, 0.35, 0.15), 0.6), rot=(0, R_(-15), 0))] + \
        [cn("GEO-trip%d" % i, 0.05, 0.0, 0.3, (-0.33 + i * 0.12, 1.07, 1.35), M("trip", (0.85, 0.87, 0.9), 0.25, 0.9), rot=(0, R_(-15), 0)) for i in (-1, 0, 1)]


def h_sumo():
    black = M("sumohair", (0.06, 0.06, 0.08), 0.4, coat=0.3)
    return [body("sumo", (0.98, 0.72, 0.62), 0.6, pattern="belt", c2=(0.85, 0.2, 0.35)),
            sph("GEO-sumocap", 1.0, (-0.3, 0, 0.18), black, scale=(1, 1.03, 1)),
            sph("GEO-sumoknot", 0.22, (-0.35, 0, 1.12), black, scale=(1.4, 0.8, 0.8))]


def h_samurai():
    dark = M("kabuto", (0.12, 0.1, 0.14), 0.3, 0.6)
    gold = M("kabutog", (1.0, 0.78, 0.25), 0.25, 1.0)
    parts = [body("samurai", (0.85, 0.15, 0.2), 0.45, pattern="stripe", c2=(0.15, 0.1, 0.12)),
             sph("GEO-kabuto", 0.97, on(BACK, 0.55), dark, scale=(1, 1.08, 0.74))]
    for sy in (-1, 1):
        parts.append(cn("GEO-kuwa%d" % sy, 0.08, 0.0, 0.7, (0.1, sy * 0.32, 1.05), gold, rot=aim((0.3, sy * 0.6, 1.0))))
    return parts + side_blade(length=1.15, side=-1, width=0.07)


def h_silat():
    return [body("silat", (0.2, 0.65, 0.45), 0.6, pattern="belt", c2=(0.85, 0.65, 0.2))] + \
        [sph("GEO-iket", 0.98, (-0.32, 0, 0.36), M("iket", (0.55, 0.3, 0.12), 0.7), scale=(1, 1, 0.75)),
         cn("GEO-iketk", 0.18, 0.0, 0.45, (-0.75, 0, 0.95), M("iket", (0.55, 0.3, 0.12), 0.7), rot=(0, R_(-60), 0))]


def h_berserker():
    return [body("berserker", (0.65, 0.12, 0.1), 0.55)] + hair_spikes((1.0, 0.45, 0.1), n=8, length=0.6) + \
        [cyl("GEO-baxe", 0.045, 1.3, (-0.2, 1.05, 0.3), M("baxeh", (0.3, 0.18, 0.08), 0.7), rot=(0, R_(-25), 0)),
         sph("GEO-baxeb", 0.35, (-0.48, 1.07, 0.88), M("baxeb", (0.55, 0.57, 0.62), 0.3, 0.9), scale=(1.1, 0.15, 0.8), rot=(0, R_(-25), 0))]


def h_biksu():
    parts = [body("biksu", (0.98, 0.6, 0.15), 0.55, pattern="stripe", c2=(0.8, 0.25, 0.1))]
    bead = M("bead", (0.45, 0.22, 0.08), 0.4, coat=0.6)
    for i in range(14):
        a = i / 14 * math.pi * 2
        parts.append(sph("GEO-bead%d" % i, 0.1, (math.cos(a) * 0.98, math.sin(a) * 0.98, -0.25 + 0.05 * math.sin(a)), bead))
    for i, d in enumerate([(-0.3, -0.18, 0.95), (-0.3, 0.18, 0.95), (-0.5, 0, 0.88)]):
        parts.append(sph("GEO-dot%d" % i, 0.07, on(d, 1.0), M("dot", (0.6, 0.3, 0.1), 0.6)))
    return parts


def h_valkyrie():
    return [body("valkyrie", (0.95, 0.8, 0.3), 0.4, 0.3), helmet((0.85, 0.87, 0.92), metal=0.85, name="valhelm")] + wings((0.98, 0.98, 1.0)) + \
        [cyl("GEO-vspear", 0.04, 2.0, (-0.1, -1.08, 0.3), M("vsp", (0.6, 0.45, 0.2), 0.6), rot=(0, R_(-12), 0)),
         cn("GEO-vspt", 0.1, 0.0, 0.35, (-0.3, -1.08, 1.4), M("vspt", (1.0, 0.95, 0.7), 0.2, 0.9, emis=(1, 0.9, 0.5), es=1.5), rot=(0, R_(-12), 0))]


def h_ninja():
    return [body("ninja", (0.35, 0.25, 0.7), 0.6), hood((0.15, 0.12, 0.25), "ninjahood")] + headband((0.85, 0.1, 0.15), z=0.42) + \
        [box("GEO-nplate", (0.3, 0.2, 0.06), (0.62, 0, 0.62), M("nplate", (0.8, 0.82, 0.86), 0.25, 0.9), rot=(0, R_(50), 0))]


def h_bayangan():
    parts = [body("bayangan", (0.12, 0.1, 0.2), 0.7), hood((0.06, 0.05, 0.1), "shadowhood")]
    for i in range(5):
        a = i / 5 * math.pi * 2
        parts.append(floater("wisp%d" % i, 0.11, (math.cos(a) * 1.25, math.sin(a) * 1.25, 0.2 + 0.2 * math.sin(a * 2)), (0.55, 0.2, 1.0), es=1.2))
    return parts


def h_pencuri():
    sack = M("sack", (0.65, 0.5, 0.3), 0.9)
    return [body("pencuri", (0.55, 0.42, 0.28), 0.6)] + headband((0.2, 0.55, 0.3), z=0.35) + \
        [sph("GEO-sack", 0.6, (-0.95, 0, 0.35), sack, scale=(0.8, 1, 1)),
         cn("GEO-sackk", 0.22, 0.05, 0.3, (-1.05, 0, 0.98), sack)]


def h_pemburu():
    return [body("pemburu", (0.5, 0.55, 0.65), 0.5)] + brim_hat((0.18, 0.15, 0.2), brim=1.4, crown_h=0.4, band=(0.7, 0.6, 0.3)) + \
        [box("GEO-xbow", (0.7, 0.1, 0.1), (0.15, 1.02, 0.0), M("xbow", (0.35, 0.2, 0.1), 0.6)),
         tor("GEO-xbowb", 0.4, 0.035, (0.4, 1.02, 0.0), M("xbowb", (0.7, 0.72, 0.76), 0.3, 0.8), rot=(0, R_(90), 0), scale=(1, 0.5, 1))]


def h_penari():
    gold = M("siger", (1.0, 0.78, 0.25), 0.25, 1.0)
    parts = [body("penari", (1.0, 0.4, 0.62), 0.45, pattern="belt", c2=(0.95, 0.75, 0.25))]
    for i in range(5):
        a = (i - 2) * 0.38
        d = V((-0.5, math.sin(a) * 0.8, 0.85)).normalized()
        parts.append(cn("GEO-siger%d" % i, 0.16, 0.02, 0.55, tuple(d * 1.0 + V((0, 0, 0.12))), gold, rot=aim(d + V((0, 0, 1))), scale=(1, 0.35, 1)))
    parts.append(tor("GEO-selendang", 1.12, 0.06, (0, 0, -0.1), M("selendang", (1.0, 0.85, 0.3), 0.6), rot=(R_(15), R_(-10), 0)))
    return parts


def h_sihirapi():
    return [body("sihirapi", (1.0, 0.45, 0.15), 0.5)] + wizard_hat((0.75, 0.1, 0.1), tip=(1.0, 0.55, 0.1))


def h_sihires():
    parts = [body("sihires", (0.4, 0.85, 1.0), 0.15, coat=1.0)]
    m = M("icecrown", (0.8, 0.97, 1.0), 0.08, coat=1.0, emis=(0.5, 0.9, 1.0), es=0.8)
    for i in range(5):
        a = (i - 2) * 0.42
        d = V((-0.45, math.sin(a) * 0.8, 0.85)).normalized()
        parts.append(cn("GEO-ice%d" % i, 0.18, 0.0, 0.7 if i == 2 else 0.5, tuple(d * 1.22), m, rot=aim(d + V((0, 0, 0.6)))))
    return parts


def h_dukun():
    batik = M("blangkon", (0.4, 0.22, 0.1), 0.7)
    parts = [body("dukun", (0.55, 0.3, 0.65), 0.6),
             sph("GEO-blangkon", 1.02, (-0.32, 0, 0.36), batik, scale=(0.95, 1, 0.7)),
             sph("GEO-mondol", 0.25, (-0.95, 0, 0.62), batik)]
    bead = M("dbead", (0.95, 0.85, 0.5), 0.3, coat=0.6)
    for i in range(10):
        a = math.pi * (0.25 + i / 9 * 1.5)
        parts.append(sph("GEO-dbead%d" % i, 0.07, (math.cos(a) * 0.95, math.sin(a) * 0.95, -0.4), bead))
    return parts


def h_necro():
    return [body("necro", (0.25, 0.55, 0.35), 0.6), hood((0.08, 0.1, 0.08), "necrohood"),
            sph("GEO-skull", 0.26, (-0.1, 1.2, 0.55), M("bone", (0.93, 0.93, 0.85), 0.5)),
            floater("necroeye", 0.06, (0.08, 1.38, 0.6), (0.4, 1.0, 0.6), es=6)]


def h_ahlipetir():
    rod = M("rod", (0.7, 0.72, 0.78), 0.25, 0.9)
    return [body("ahlipetir", (1.0, 0.82, 0.2), 0.35, 0.3)] + hair_spikes((1.0, 0.95, 0.4), n=7, length=0.55, name="phair") + \
        [cyl("GEO-rod", 0.04, 0.8, (-0.2, -0.9, 0.9), rod, rot=(R_(25), 0, 0)),
         floater("rodball", 0.12, (-0.2, -1.07, 1.28), (0.9, 0.95, 1.0), es=6)]


def h_pemanah():
    green = M("robincap", (0.25, 0.5, 0.15), 0.7)
    return [body("pemanah", (0.5, 0.75, 0.3), 0.6),
            cn("GEO-robin", 0.85, 0.05, 0.75, (-0.35, 0, 0.98), green, rot=(0, R_(-55), 0), scale=(1, 0.75, 1)),
            cn("GEO-feather", 0.06, 0.0, 0.6, (-0.45, 0.3, 1.25), M("feather", (0.9, 0.15, 0.1), 0.6), rot=(R_(-20), R_(-50), 0)),
            tor("GEO-bow", 0.75, 0.04, (-0.1, 1.05, 0.15), M("bow", (0.55, 0.32, 0.12), 0.5), rot=(R_(90), 0, 0), scale=(0.45, 1, 1))]


def h_koboi():
    return [body("koboi", (0.8, 0.55, 0.3), 0.6)] + brim_hat((0.45, 0.28, 0.12), brim=1.38, crown_h=0.5, band=(0.2, 0.12, 0.06)) + gun(length=0.7)


def h_sniper():
    beret = M("beret", (0.15, 0.15, 0.2), 0.8)
    return [body("sniper", (0.95, 0.3, 0.55), 0.5),
            sph("GEO-beret", 0.82, (-0.35, 0, 0.82), beret, scale=(1, 1, 0.35), rot=(0, R_(-25), 0)),
            cyl("GEO-scope", 0.12, 0.4, (0.35, -0.72, 0.65), M("scope", (0.2, 0.2, 0.24), 0.3, 0.7), rot=(0, R_(90), 0)),
            floater("lens", 0.09, (0.56, -0.72, 0.65), (1.0, 0.2, 0.4), es=4)] + gun(length=1.25, side=1)


def h_bajaklaut():
    black = M("tricorn", (0.08, 0.08, 0.1), 0.7)
    return [body("bajaklaut", (0.25, 0.45, 0.75), 0.55, pattern="stripe", c2=(0.95, 0.95, 0.95)),
            sph("GEO-tricorn", 1.15, (-0.25, 0, 0.82), black, scale=(1, 1.1, 0.28), rot=(0, R_(-18), 0)),
            sph("GEO-tricornc", 0.6, (-0.3, 0, 0.98), black, scale=(1, 1, 0.6)),
            sph("GEO-skullemb", 0.13, (0.25, 0, 1.08), M("bone", (0.93, 0.93, 0.85), 0.5), scale=(1, 1, 0.5))]


def h_grenadier():
    olive = M("armyhelm", (0.3, 0.38, 0.18), 0.7)
    parts = [body("grenadier", (0.42, 0.55, 0.25), 0.65, pattern="belt", c2=(0.3, 0.22, 0.12)),
             sph("GEO-armyhelm", 0.98, on(BACK, 0.5), olive, scale=(1, 1.05, 0.72)),
             tor("GEO-goggle", 0.86, 0.06, (-0.1, 0, 0.55), M("strap", (0.2, 0.15, 0.1), 0.7), rot=(0, R_(-15), 0))]
    for i in range(3):
        parts.append(sph("GEO-gren%d" % i, 0.14, (-0.3 + i * 0.3, 1.0, -0.25), M("gren", (0.25, 0.35, 0.15), 0.5)))
    return parts


def h_pendeta():
    return [body("pendeta", (1.0, 0.88, 0.5), 0.45, pattern="stripe", c2=(1.0, 1.0, 1.0)),
            hood((0.97, 0.97, 1.0), "pendetahood"),
            tor("GEO-halo", 0.6, 0.06, (-0.25, 0, 1.35), M("halo", (1.0, 0.9, 0.4), 0.2, emis=(1.0, 0.85, 0.3), es=5), rot=(0, R_(-15), 0))]


def h_bard():
    beret = M("bardcap", (0.35, 0.1, 0.45), 0.7)
    wood = M("lute", (0.75, 0.45, 0.15), 0.4, coat=0.6)
    return [body("bard", (0.88, 0.35, 0.82), 0.5),
            sph("GEO-bardcap", 0.85, (-0.35, 0, 0.8), beret, scale=(1.1, 1, 0.35), rot=(0, R_(-25), 0)),
            cn("GEO-bfeather", 0.07, 0.0, 0.8, (-0.7, 0.25, 1.2), M("bfeather", (1.0, 0.85, 0.2), 0.6), rot=(R_(-15), R_(-60), 0)),
            sph("GEO-lute", 0.42, (0.1, 1.05, -0.2), wood, scale=(1, 0.35, 0.8)),
            box("GEO-luten", (0.12, 0.06, 0.8), (-0.1, 1.05, 0.45), M("luten", (0.35, 0.2, 0.08), 0.6), rot=(0, R_(-20), 0))]


def h_druid():
    leaf = M("leaf", (0.3, 0.7, 0.2), 0.6)
    antler = M("antler", (0.55, 0.38, 0.2), 0.7)
    parts = [body("druid", (0.55, 0.85, 0.3), 0.6)]
    for i in range(7):
        a = math.pi * (0.35 + i / 6 * 1.3)
        d = V((math.cos(a) * 0.75 - 0.1, math.sin(a) * 0.75, 0.6)).normalized()
        parts.append(sph("GEO-leaf%d" % i, 0.22, tuple(d * 1.02), leaf, scale=(1, 0.5, 0.25), rot=aim(d)))
    for sy in (-1, 1):
        parts.append(cn("GEO-antler%d" % sy, 0.07, 0.01, 0.65, (-0.35, sy * 0.45, 1.05), antler, rot=aim((-0.3, sy * 0.5, 1))))
    return parts


def h_mekanik():
    metal = M("goggle", (0.6, 0.45, 0.2), 0.3, 0.8)
    parts = [body("mekanik", (0.6, 0.63, 0.72), 0.45, 0.4, pattern="belt", c2=(0.95, 0.55, 0.1))]
    parts.append(tor("GEO-mstrap", 0.87, 0.05, (-0.1, 0, 0.6), M("mstrap", (0.2, 0.15, 0.1), 0.7), rot=(0, R_(-20), 0)))
    for sy in (-1, 1):
        parts.append(cyl("GEO-mgog%d" % sy, 0.17, 0.12, (0.2, sy * 0.28, 0.92), metal, rot=aim((0.3, 0, 1))))
    parts += [cyl("GEO-wrench", 0.05, 0.9, (-0.15, 1.05, 0.2), M("wrench", (0.75, 0.77, 0.82), 0.3, 0.9), rot=(0, R_(-30), 0)),
              tor("GEO-wrenchh", 0.13, 0.05, (-0.38, 1.05, 0.62), M("wrench", (0.75, 0.77, 0.82), 0.3, 0.9), rot=(R_(90), 0, 0))]
    return parts


def h_peramal():
    cloth = M("turban", (0.6, 0.3, 0.85), 0.6)
    return [body("peramal", (0.72, 0.55, 1.0), 0.45),
            tor("GEO-turban1", 0.72, 0.2, (-0.2, 0, 0.72), cloth, rot=(0, R_(-20), 0)),
            sph("GEO-turban2", 0.6, (-0.25, 0, 0.92), cloth, scale=(1, 1, 0.6)),
            floater("tgem", 0.1, (0.45, 0, 0.9), (0.3, 1.0, 0.6), es=5),
            sph("GEO-orb", 0.3, (0.1, 1.18, 0.1), M("crystal", (0.75, 0.6, 1.0), 0.05, coat=1.0, emis=(0.6, 0.4, 1.0), es=1.5))]


def h_paladin():
    return [body("paladin", (0.95, 0.75, 0.25), 0.4, 0.4, pattern="stripe", c2=(1.0, 1.0, 1.0)), helmet((0.98, 0.95, 0.88), metal=0.5, name="palhelm")] + \
        [box("GEO-cross1", (0.08, 0.4, 0.06), (-0.25, 0, 1.25), M("pcross", (1.0, 0.85, 0.3), 0.3, 0.8), rot=(0, R_(-25), 0)),
         cyl("GEO-hammer", 0.045, 1.1, (-0.2, 1.05, 0.2), M("hamh", (0.45, 0.3, 0.15), 0.6), rot=(0, R_(-25), 0)),
         box("GEO-hamb", (0.5, 0.3, 0.3), (-0.43, 1.05, 0.72), M("hamb", (0.8, 0.82, 0.86), 0.3, 0.9), rot=(0, R_(-25), 0))]


def h_barong():
    mane = M("mane", (1.0, 0.75, 0.2), 0.5, 0.4)
    parts = [body("barong", (0.85, 0.2, 0.15), 0.5, pattern="noise", c2=(0.95, 0.75, 0.2))]
    for i in range(11):
        a = math.pi * (0.3 + i / 10 * 1.4)
        d = V((math.cos(a) * 0.85, math.sin(a) * 0.85, 0.45)).normalized()
        parts.append(cn("GEO-mane%d" % i, 0.18, 0.0, 0.5, tuple(d * 1.0), mane, rot=aim(d)))
    for sy in (-1, 1):
        parts.append(floater("barongeye%d" % sy, 0.06, on((-0.2, sy * 0.55, 0.85), 1.02), (1.0, 0.85, 0.2), es=2))
    return parts


def h_juggernaut():
    steel = M("jughelm", (0.45, 0.48, 0.55), 0.3, 0.9)
    parts = [body("juggernaut", (0.42, 0.48, 0.56), 0.35, 0.7, pattern="belt", c2=(0.85, 0.35, 0.1)),
             sph("GEO-jughelm", 0.99, on(BACK, 0.45), steel, scale=(1, 1.05, 0.78))]
    for sy in (-1, 1):
        d = V((-0.3, sy * 1, 0.2)).normalized()
        parts.append(cn("GEO-jspike%d" % sy, 0.2, 0.0, 0.5, tuple(d * 1.05), M("jspike", (0.85, 0.87, 0.9), 0.25, 0.9), rot=aim(d)))
    return parts


def h_petinju():
    glove = M("glove", (0.9, 0.1, 0.1), 0.35, coat=0.7)
    return [body("petinju", (0.95, 0.5, 0.3), 0.55)] + headband((0.95, 0.95, 0.95), z=0.5, name="pband", tails=False) + \
        [sph("GEO-glove%d" % sy, 0.36, (0.55, sy * 0.95, -0.1), glove) for sy in (-1, 1)]


def h_jawara():
    black = M("peci", (0.06, 0.06, 0.08), 0.6)
    return [body("jawara", (0.62, 0.32, 0.18), 0.6, pattern="belt", c2=(0.85, 0.15, 0.15)),
            cyl("GEO-peci", 0.62, 0.42, (-0.3, 0, 0.98), black, rot=(0, R_(-25), 0), scale=(1, 0.95, 1))] + \
        side_blade(color=(0.82, 0.84, 0.88), handle=(0.25, 0.12, 0.05), length=0.85, side=1, angle=25, width=0.14, name="golok")


def h_ronin():
    straw = M("straw", (0.85, 0.72, 0.42), 0.9)
    return [body("ronin", (0.35, 0.42, 0.7), 0.6),
            cn("GEO-kasa", 1.1, 0.08, 0.4, (-0.4, 0, 0.95), straw, rot=(0, R_(-28), 0))] + side_blade(length=1.1, side=-1, width=0.07, name="rblade")


def h_pembunuh():
    parts = [body("pembunuh", (0.32, 0.25, 0.4), 0.65), hood((0.12, 0.1, 0.16), "phood"),
             cn("GEO-hoodtip", 0.35, 0.0, 0.5, (-0.6, 0, 1.0), M("phood", (0.12, 0.1, 0.16), 0.75), rot=(0, R_(-55), 0))]
    for sy in (-1, 1):
        parts.append(box("GEO-dagger%d" % sy, (0.5, 0.05, 0.08), (0.35, sy * 1.0, -0.2), M("dagger", (0.85, 0.87, 0.92), 0.2, 0.9), rot=(0, R_(15), 0)))
    return parts


def h_kunoichi():
    hair = M("khair", (0.12, 0.08, 0.15), 0.4, coat=0.4)
    return [body("kunoichi", (0.85, 0.3, 0.5), 0.5),
            sph("GEO-khaircap", 1.0, (-0.3, 0, 0.18), hair, scale=(1, 1.03, 1)),
            sph("GEO-kpony", 0.3, (-0.95, 0, 0.75), hair, scale=(1, 0.8, 1.4), rot=(0, R_(-30), 0)),
            box("GEO-kmask", (0.35, 1.3, 0.25), (0.7, 0, -0.15), M("kmask", (0.15, 0.12, 0.18), 0.7), bevel=0.08)] + \
        headband((0.95, 0.85, 0.3), z=0.5, name="kband")


def h_penjebak():
    return [body("penjebak", (0.6, 0.55, 0.3), 0.7, pattern="belt", c2=(0.3, 0.25, 0.15))] + \
        brim_hat((0.4, 0.38, 0.2), brim=1.1, crown_h=0.35, crown_r=0.6, name="boonie") + \
        [cyl("GEO-mine%d" % i, 0.16, 0.08, (-0.25 + i * 0.35, 1.02, -0.3), M("mine", (0.3, 0.3, 0.2), 0.6), rot=(R_(90), 0, 0)) for i in range(2)]


def h_waktu():
    gold = M("hgold", (1.0, 0.78, 0.25), 0.25, 1.0)
    sand = M("sand", (0.95, 0.85, 0.5), 0.3, emis=(1.0, 0.85, 0.4), es=1)
    return [body("waktu", (0.25, 0.7, 0.78), 0.35, coat=0.8), hood((0.12, 0.3, 0.4), "whood"),
            cn("GEO-hg1", 0.22, 0.02, 0.3, (-0.2, 1.18, 0.55), sand, rot=(R_(180), 0, 0)),
            cn("GEO-hg2", 0.22, 0.02, 0.3, (-0.2, 1.18, 0.25), sand),
            cyl("GEO-hgt", 0.26, 0.04, (-0.2, 1.18, 0.72), gold), cyl("GEO-hgb", 0.26, 0.04, (-0.2, 1.18, 0.08), gold)]


def h_alkemis():
    glass = M("flask", (0.7, 1.0, 0.3), 0.05, coat=1.0, emis=(0.6, 1.0, 0.2), es=2)
    return [body("alkemis", (0.62, 0.8, 0.2), 0.55, pattern="belt", c2=(0.45, 0.3, 0.15))] + \
        [tor("GEO-astrap", 0.87, 0.05, (-0.1, 0, 0.6), M("astrap", (0.25, 0.18, 0.1), 0.7), rot=(0, R_(-20), 0))] + \
        [cyl("GEO-agog%d" % sy, 0.16, 0.12, (0.2, sy * 0.28, 0.92), M("agog", (0.3, 0.8, 0.9), 0.1, coat=1.0), rot=aim((0.3, 0, 1))) for sy in (-1, 1)] + \
        [sph("GEO-flask", 0.3, (0.0, 1.12, -0.1), glass), cyl("GEO-flaskn", 0.08, 0.3, (0.0, 1.12, 0.28), M("cork", (0.6, 0.45, 0.3), 0.8))]


def h_pawang():
    cloud = M("rcloud", (0.75, 0.8, 0.9), 0.8)
    parts = [body("pawang", (0.3, 0.55, 0.85), 0.5)] + headband((0.95, 0.95, 0.95), z=0.5, name="pwband", tails=False)
    for i, (dx, dy, r) in enumerate([(-0.7, -0.25, 0.3), (-0.7, 0.2, 0.35), (-0.5, 0.0, 0.32), (-0.9, 0.0, 0.25)]):
        parts.append(sph("GEO-rc%d" % i, r, (dx, dy, 1.25), cloud))
    for i in range(3):
        parts.append(cyl("GEO-drop%d" % i, 0.03, 0.18, (-0.7 + (i - 1) * 0.05, -0.2 + i * 0.2, 0.92), M("drop", (0.5, 0.75, 1.0), 0.2, emis=(0.5, 0.8, 1.0), es=1)))
    return parts


def h_nelayan():
    straw = M("caping", (0.88, 0.75, 0.45), 0.9)
    return [body("nelayan", (0.25, 0.65, 0.85), 0.55, pattern="stripe", c2=(0.95, 0.95, 0.95)),
            cn("GEO-caping", 1.1, 0.05, 0.5, (-0.4, 0, 0.98), straw, rot=(0, R_(-28), 0)),
            cyl("GEO-rod2", 0.03, 2.2, (-0.3, 1.05, 0.5), M("frod", (0.4, 0.25, 0.12), 0.6), rot=(0, R_(-40), 0))]


def h_gunner():
    return [body("gunner", (0.6, 0.45, 0.25), 0.65)] + headband((0.85, 0.2, 0.15), z=0.5, name="gband") + gun(length=0.85, barrels=2)


def h_sumpit():
    parts = [body("sumpit", (0.4, 0.65, 0.25), 0.6, pattern="belt", c2=(0.85, 0.2, 0.15))] + headband((0.85, 0.75, 0.3), z=0.5, name="dband", tails=False)
    for i, c in enumerate([(0.1, 0.1, 0.1), (0.95, 0.95, 0.95), (0.1, 0.1, 0.1)]):
        parts.append(cn("GEO-dfeather%d" % i, 0.07, 0.0, 0.6, (-0.75, (i - 1) * 0.18, 1.05), M("dfeather%d" % i, c, 0.6), rot=(0, R_(-30), 0)))
    parts.append(cyl("GEO-blowpipe", 0.045, 2.2, (0.0, 1.02, 0.2), M("pipe", (0.5, 0.35, 0.15), 0.6), rot=(0, R_(80), 0)))
    return parts


def h_tabib():
    return [body("tabib", (0.85, 0.68, 0.45), 0.6)] + headband((0.2, 0.55, 0.3), z=0.5, name="tband") + \
        [cyl("GEO-jamu", 0.2, 0.5, (0.0, 1.1, -0.1), M("jamub", (0.45, 0.25, 0.1), 0.4, coat=0.6)),
         cyl("GEO-jamuc", 0.12, 0.12, (0.0, 1.1, 0.22), M("cork", (0.6, 0.45, 0.3), 0.8))]


def h_dalang():
    batik = M("dblangkon", (0.25, 0.15, 0.08), 0.7)
    gold = M("wgold", (1.0, 0.75, 0.25), 0.3, 0.9)
    return [body("dalang", (0.75, 0.55, 0.3), 0.6, pattern="stripe", c2=(0.3, 0.18, 0.08)),
            sph("GEO-dblangkon", 1.02, (-0.32, 0, 0.36), batik, scale=(0.95, 1, 0.7)),
            box("GEO-wayang", (0.35, 0.04, 0.7), (-0.1, 1.08, 0.35), gold, rot=(0, R_(-15), 0)),
            cyl("GEO-wstick", 0.025, 0.9, (0.02, 1.08, -0.3), M("wstick", (0.3, 0.2, 0.1), 0.6), rot=(0, R_(-15), 0))]


def h_totem():
    parts = [body("totem", (0.78, 0.4, 0.22), 0.6, pattern="belt", c2=(0.2, 0.55, 0.45))]
    cols = [(0.9, 0.2, 0.15), (1.0, 0.8, 0.2), (0.2, 0.5, 0.9), (0.95, 0.95, 0.95)]
    for i in range(9):
        a = math.pi * (0.4 + i / 8 * 1.2)
        d = V((math.cos(a) * 0.7 - 0.2, math.sin(a) * 0.7, 0.75)).normalized()
        parts.append(cn("GEO-tfeather%d" % i, 0.09, 0.0, 0.6, tuple(d * 1.0), M("tfeather%d" % (i % 4), cols[i % 4], 0.6), rot=aim(d + V((-0.3, 0, 0.5)))))
    parts.append(box("GEO-tpole", (0.22, 0.22, 0.9), (-0.2, 1.08, 0.15), M("tpole", (0.6, 0.35, 0.15), 0.7)))
    return parts


def h_gong():
    gold = M("gongm", (1.0, 0.75, 0.25), 0.25, 1.0)
    return [body("gong", (0.85, 0.65, 0.2), 0.45, 0.3)] + headband((0.6, 0.15, 0.1), z=0.5, name="goband", tails=False) + \
        [cyl("GEO-gong", 0.55, 0.08, (-0.1, 1.1, 0.25), gold, rot=(R_(90), 0, 0)),
         sph("GEO-gongk", 0.14, (-0.1, 1.16, 0.25), gold),
         cyl("GEO-mallet", 0.035, 0.7, (0.45, -1.0, 0.2), M("mallet", (0.4, 0.25, 0.1), 0.6), rot=(0, R_(-30), 0)),
         sph("GEO-malleth", 0.13, (0.28, -1.0, 0.5), M("malleth", (0.9, 0.85, 0.75), 0.8))]


def h_golem():
    parts = build_batu()
    parts.append(cn("GEO-gcrystal", 0.2, 0.0, 0.55, (-0.5, 0, 0.95), M("gcrystal", (0.4, 0.9, 1.0), 0.1, coat=1.0, emis=(0.3, 0.8, 1.0), es=2), rot=(0, R_(-30), 0)))
    moss = M("moss", (0.3, 0.6, 0.2), 0.9)
    for i, d in enumerate([(-0.3, 0.5, 0.8), (-0.6, -0.4, 0.7), (0.1, -0.7, 0.7)]):
        parts.append(sph("GEO-moss%d" % i, 0.25, on(d, 0.98), moss, scale=(1, 1, 0.35), rot=aim(d)))
    return parts


def h_kosmos():
    parts = build_lubang()
    parts += wizard_hat((0.2, 0.1, 0.45), tip=(1.0, 0.9, 0.5), name="cwiz")
    return parts


BUILDERS = {k[2:]: v for k, v in list(globals().items()) if k.startswith("h_") and callable(v)}


def clear_geometry():
    for o in list(bpy.data.objects):
        if o.type in {"MESH", "CURVE", "EMPTY"}:
            bpy.data.objects.remove(o, do_unlink=True)
    for m in list(bpy.data.meshes):
        if m.users == 0:
            bpy.data.meshes.remove(m)


def save_strip(paths, out_path):
    """Susun frame jadi grid COLS kolom (frame 0 di kiri atas, urut ke kanan lalu ke bawah)."""
    rows = math.ceil(len(paths) / COLS)
    W, H = SIZE * COLS, SIZE * rows
    strip = np.zeros((H, W, 4), dtype=np.float32)
    for i, p in enumerate(paths):
        img = bpy.data.images.load(p)
        px = np.array(img.pixels[:], dtype=np.float32).reshape(SIZE, SIZE, 4)
        r, c = divmod(i, COLS)
        y0 = H - (r + 1) * SIZE  # piksel Blender dihitung dari bawah
        strip[y0:y0 + SIZE, c * SIZE:(c + 1) * SIZE, :] = px
        bpy.data.images.remove(img)
    out = bpy.data.images.new("strip", W, H, alpha=True)
    out.pixels[:] = strip.ravel()
    out.filepath_raw = out_path
    out.file_format = "PNG"
    out.save()
    bpy.data.images.remove(out)


def to_webp(png_path, quality=88):
    """Ubah PNG jadi WebP (dengan alpha) supaya ringan dibuka di HP, lalu hapus PNG-nya."""
    scene = bpy.context.scene
    st = scene.render.image_settings
    img = bpy.data.images.load(png_path)
    st.file_format = "WEBP"
    st.color_mode = "RGBA"
    st.quality = quality
    webp = os.path.splitext(png_path)[0] + ".webp"
    img.save_render(webp, scene=scene)
    bpy.data.images.remove(img)
    st.file_format = "PNG"
    os.remove(png_path)
    return webp


# ---------------------------------------------------------------- gaya anime
# Wajah: (ekspresi, warna iris, radius permukaan bola, tinggi mata). Wajah selalu menghadap +X (arah gerak di game).
FACES = {}  # wajah digambar 2D di game (drawFace di render.js)
ROT_FACE = {}

EYE_SHAPE = {  # (lebar, tinggi, besar iris, sudut alis atau None)
    "normal": (0.8, 1.15, 0.62, None),
    "cute": (0.95, 1.3, 0.72, None),
    "fierce": (1.0, 0.8, 0.6, 0.45),
    "angry": (1.0, 0.75, 0.55, 0.6),
    "sleepy": (1.0, 0.42, 0.75, None),
    "grumpy": (1.0, 0.5, 0.7, 0.15),
    "sly": (1.05, 0.6, 0.6, 0.3),
    "cool": (1.1, 0.55, 0.65, None),
    "excited": (0.95, 1.3, 0.7, None),
    "happy": (0.9, 1.1, 0.66, None),
}


def surface_part(name, radius, center_dir, rad, lift, scale, mat, spin=0.0):
    """Bulatan pipih yang menempel di permukaan bola, menghadap keluar (sumbu Y lokal = atas)."""
    import mathutils
    d = mathutils.Vector(center_dir).normalized()
    o = sphere(name, radius, tuple(d * (rad + lift)), 24, 12)
    q = d.to_track_quat("Z", "Y")
    if spin:
        q = q @ mathutils.Quaternion((0, 0, 1), spin)
    o.rotation_euler = q.to_euler()
    o.scale = scale
    assign(o, mat)
    return o


def add_face(style, iris, rad, elev):
    import mathutils
    w, h, irs, brow = EYE_SHAPE[style]
    white = principled("MAT-eye-white", (1, 1, 1), rough=0.4)[0]
    iris_m = principled("MAT-iris", iris, rough=0.3)[0]
    pupil = principled("MAT-pupil", (0.03, 0.03, 0.06), rough=0.3)[0]
    hl = principled("MAT-eye-hl", (1, 1, 1), emis=(1, 1, 1), emis_str=2.0)[0]
    dark = principled("MAT-brow", (0.08, 0.06, 0.1), rough=0.5)[0]
    parts = []
    er = 0.25 * rad
    for sy in (-1, 1):
        d = (0.86, sy * 0.33, elev)
        # lapisan mata ditumpuk keluar: putih -> iris -> pupil -> kilau (tiap lapisan menonjol di atas yang sebelumnya)
        wd = er * 0.3
        parts.append(surface_part("GEO-eyewhite", er, d, rad, -wd * 0.4, (w, h, 0.3), white))
        parts.append(surface_part("GEO-iris", er * irs, d, rad, wd * 0.45, (w, min(h, 1.1), 0.22), iris_m))
        parts.append(surface_part("GEO-pupil", er * irs * 0.5, d, rad, wd * 0.75, (w, min(h, 1.0), 0.2), pupil))
        hd = mathutils.Vector(d).normalized() + mathutils.Vector((0, sy * -0.05, 0.08))
        parts.append(surface_part("GEO-hl", er * 0.28, hd, rad, wd * 1.0, (1, 1, 0.2), hl))
        if style in ("cute", "excited"):
            hd2 = mathutils.Vector(d).normalized() + mathutils.Vector((0, sy * 0.06, -0.07))
            parts.append(surface_part("GEO-hl", er * 0.15, hd2, rad, wd * 1.0, (1, 1, 0.2), hl))
        if brow is not None:
            bd = mathutils.Vector(d).normalized() + mathutils.Vector((0, 0, er * h * 1.05 + 0.04))
            parts.append(surface_part("GEO-brow", er * 0.8, bd, rad, wd * 0.5, (1.25, 0.24, 0.3), dark, spin=sy * brow))
    if style in ("happy", "cute", "excited"):
        parts.append(surface_part("GEO-mouth", 0.07 * rad, (0.95, 0, elev - 0.22), rad, 0.01, (1.2, 0.7, 0.3), dark))
    return parts


def mat_input(node, name):
    for s in node.inputs:
        if s.name == name and s.enabled:
            return s
    for s in node.inputs:
        if s.name == name:
            return s
    return None


def toonify(mat):
    """Ubah material Principled jadi cel-shading anime: bayangan bertingkat tegas + kilau keras + cahaya tetap."""
    if mat.get("toon") or mat.name.startswith("MAT-outline") or mat.name.startswith("MAT-eye-hl"):
        return
    nt = mat.node_tree
    N, L = nt.nodes, nt.links
    bsdf = next((n for n in N if n.type == "BSDF_PRINCIPLED"), None)
    out = next((n for n in N if n.type == "OUTPUT_MATERIAL"), None)
    if not bsdf or not out:
        return

    def src(name):
        s = mat_input(bsdf, name)
        if s is None:
            return None, None
        return (s.links[0].from_socket if s.is_linked else None), s.default_value

    base_l, base_v = src("Base Color")
    emc_l, emc_v = src("Emission Color")
    ems_l, ems_v = src("Emission Strength")
    nrm_l, _ = src("Normal")
    rough = mat_input(bsdf, "Roughness").default_value
    metal = mat_input(bsdf, "Metallic").default_value
    coat_s = mat_input(bsdf, "Coat Weight")
    coat = coat_s.default_value if coat_s else 0.0
    alpha = mat_input(bsdf, "Alpha").default_value

    diff = N.new("ShaderNodeBsdfDiffuse")
    if nrm_l:
        L.new(nrm_l, diff.inputs["Normal"])
    s2r = N.new("ShaderNodeShaderToRGB")
    L.new(diff.outputs[0], s2r.inputs[0])
    ramp = N.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "CONSTANT"
    els = ramp.color_ramp.elements
    els[0].position, els[0].color = 0.0, (0.5, 0.52, 0.8, 1)   # bayangan kebiruan ala anime
    els[1].position, els[1].color = 0.035, (0.84, 0.86, 0.98, 1)
    e = els.new(0.2)
    e.color = (1, 1, 1, 1)
    L.new(s2r.outputs["Color"], ramp.inputs["Fac"])

    mul = N.new("ShaderNodeVectorMath")
    mul.operation = "MULTIPLY"
    if base_l:
        L.new(base_l, mul.inputs[0])
    else:
        mul.inputs[0].default_value = tuple(base_v)[:3]
    L.new(ramp.outputs["Color"], mul.inputs[1])
    col = mul.outputs[0]

    shiny = max(0.0, 1.0 - rough) * (0.45 + 0.55 * max(metal, coat))
    if shiny > 0.3:
        gl = N.new("ShaderNodeBsdfGlossy")
        gl.inputs["Roughness"].default_value = 0.2
        if nrm_l:
            L.new(nrm_l, gl.inputs["Normal"])
        s2 = N.new("ShaderNodeShaderToRGB")
        L.new(gl.outputs[0], s2.inputs[0])
        r2 = N.new("ShaderNodeValToRGB")
        r2.color_ramp.interpolation = "CONSTANT"
        r2.color_ramp.elements[0].color = (0, 0, 0, 1)
        r2.color_ramp.elements[1].position = 0.55
        r2.color_ramp.elements[1].color = (1, 1, 1, 1)
        L.new(s2.outputs["Color"], r2.inputs["Fac"])
        sc = N.new("ShaderNodeVectorMath")
        sc.operation = "SCALE"
        L.new(r2.outputs["Color"], sc.inputs[0])
        sc.inputs["Scale"].default_value = min(0.85, shiny)
        add = N.new("ShaderNodeVectorMath")
        add.operation = "ADD"
        L.new(col, add.inputs[0])
        L.new(sc.outputs[0], add.inputs[1])
        col = add.outputs[0]

    if ems_l or (ems_v or 0) > 0:
        em = N.new("ShaderNodeVectorMath")
        em.operation = "SCALE"
        if emc_l:
            L.new(emc_l, em.inputs[0])
        else:
            em.inputs[0].default_value = tuple(emc_v)[:3]
        if ems_l:
            L.new(ems_l, em.inputs["Scale"])
        else:
            em.inputs["Scale"].default_value = ems_v
        add = N.new("ShaderNodeVectorMath")
        add.operation = "ADD"
        L.new(col, add.inputs[0])
        L.new(em.outputs[0], add.inputs[1])
        col = add.outputs[0]

    emit = N.new("ShaderNodeEmission")
    L.new(col, emit.inputs["Color"])
    final = emit.outputs[0]
    if alpha < 0.999:
        tr = N.new("ShaderNodeBsdfTransparent")
        mx = N.new("ShaderNodeMixShader")
        mx.inputs[0].default_value = alpha
        L.new(tr.outputs[0], mx.inputs[1])
        L.new(final, mx.inputs[2])
        final = mx.outputs[0]
    L.new(final, out.inputs["Surface"])
    mat["toon"] = 1


def outline_mat():
    m = bpy.data.materials.get("MAT-outline")
    if m:
        return m
    m = bpy.data.materials.new("MAT-outline")
    m.use_nodes = True
    N, L = m.node_tree.nodes, m.node_tree.links
    for n in list(N):
        N.remove(n)
    out = N.new("ShaderNodeOutputMaterial")
    em = N.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = (0.05, 0.05, 0.11, 1)
    L.new(em.outputs[0], out.inputs["Surface"])
    m.use_backface_culling = True
    return m


def add_outline(obj, width=0.035):
    """Garis luar ala anime (inverted hull): cangkang terbalik sedikit lebih besar, hanya sisi belakangnya yang tampak."""
    if obj.type != "MESH" or "hl" in obj.name or "pupil" in obj.name:
        return
    om = outline_mat()
    if om.name not in [m.name for m in obj.data.materials if m]:
        obj.data.materials.append(om)
    idx = [m.name if m else "" for m in obj.data.materials].index(om.name)
    s = max(obj.scale) or 1.0
    mod = obj.modifiers.new("SLD-outline", "SOLIDIFY")
    mod.thickness = width / s
    mod.offset = 1.0
    mod.use_flip_normals = True
    mod.use_rim = False
    mod.material_offset = idx


FACE_MATS = {"MAT-eye", "MAT-brow", "MAT-fang", "MAT-hantu-eye", "MAT-naga-eye", "MAT-shadow-eye"}


def strip_face(parts):
    """Buang mata/mulut/taring 3D. Wajah anime digambar 2D di game (lihat drawFace di render.js)."""
    keep = []
    for o in parts:
        mats = [m.name.split(".")[0] for m in getattr(getattr(o, "data", None), "materials", []) if m]
        if o.name.startswith(("GEO-eye", "GEO-mouth", "GEO-fang")) or FACE_MATS.intersection(mats):
            bpy.data.objects.remove(o, do_unlink=True)
        else:
            keep.append(o)
    return keep


NOFACE = os.environ.get("WB_NOFACE") == "1"


def animefy(parts, name):
    """Terapkan wajah + cel-shading + garis luar ke bagian-bagian bola."""
    if NOFACE:
        parts = strip_face(parts)
    elif name in FACES:
        style, iris, rad, elev = FACES[name]
        parts = parts + add_face(style, iris, rad, elev)
    for o in parts:
        mats = list(o.data.materials) if getattr(o, "data", None) is not None and hasattr(o.data, "materials") else []
        for m in mats:
            if m:
                toonify(m)
    for o in parts:
        add_outline(o, 0.03 if ("eye" in o.name or "iris" in o.name or "brow" in o.name or "mouth" in o.name) else 0.04)
    return parts


def render_ball(scene, name):
    clear_geometry()
    root = new_root("EMP-" + name)
    parts = animefy(BUILDERS[name](), name)
    parent_to(parts, root)
    base_rot = ROT_FACE.get(name, 0.0)
    paths = []
    for f in range(FRAMES):
        root.rotation_euler = (0, 0, base_rot + 2 * math.pi * f / FRAMES)
        p = os.path.join(TMP, "%s_%02d.png" % (name, f))
        scene.render.filepath = p
        bpy.ops.render.render(write_still=True)
        paths.append(p)
    out = os.path.join(OUT, name + ".png")
    save_strip(paths, out)
    out = to_webp(out)
    print("done:%s %s" % (name, out))


def render_blade(scene):
    """Pedang tampak atas, panjang ke +X. Disimpan 512x128."""
    clear_geometry()
    cam = scene.camera
    old = (tuple(cam.location), tuple(cam.rotation_euler), cam.data.ortho_scale)
    scene.render.resolution_x, scene.render.resolution_y = 512, 128
    cam.location = (0, 0, 10)
    cam.rotation_euler = (0, 0, 0)
    cam.data.ortho_scale = 4.0  # lebar 4 unit -> 128 px/unit
    reset_world(scene, (0.6, 0.65, 0.75, 1.0), 1.0)  # langit terang supaya logam memantulkan sesuatu
    steel = principled("MAT-steel", (0.85, 0.88, 0.92), rough=0.3, metal=0.85)[0]
    gold = principled("MAT-gold", (1.0, 0.72, 0.25), rough=0.25, metal=1.0)[0]
    leather = principled("MAT-grip", (0.35, 0.18, 0.08), rough=0.7)[0]
    # bilah: kotak ramping dengan ujung lancip
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0.55, 0, 0))
    blade = bpy.context.active_object
    blade.name = "GEO-blade"
    blade.scale = (2.6, 0.13, 0.04)  # katana: bilah ramping
    bpy.ops.object.transform_apply(scale=True)
    for v in blade.data.vertices:
        if v.co.x > 1.0:
            v.co.y = 0.0
            v.co.x = 1.95
    bpy.ops.object.modifier_add(type="BEVEL")
    blade.modifiers[-1].width = 0.02
    assign(blade, steel)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.78, 0, 0))
    guard = bpy.context.active_object
    guard.scale = (0.08, 0.36, 0.36)  # tsuba
    assign(guard, gold)
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.07, depth=0.7, location=(-1.18, 0, 0), rotation=(0, math.pi / 2, 0))
    grip = bpy.context.active_object
    leather = principled("MAT-tsuka", (0.08, 0.06, 0.1), rough=0.8)[0]
    assign(grip, leather)
    sphere("GEO-pommel", 0.08, (-1.55, 0, 0), 16, 8).data.materials.append(gold)
    p = os.path.join(OUT, "samurai_blade.png")
    scene.render.filepath = p
    bpy.ops.render.render(write_still=True)
    p = to_webp(p)
    print("done:blade %s" % p)
    cam.location, cam.rotation_euler, cam.data.ortho_scale = old
    reset_world(scene)
    scene.render.resolution_x = scene.render.resolution_y = SIZE


def save_preview(names):
    """Lembar cek: frame 0 dan 4 tiap bola di atas latar gelap (seperti di game)."""
    cols = 5
    rows = math.ceil(len(names) / cols)
    cell = SIZE
    W, H = cols * cell * 2, rows * cell
    bg = np.zeros((H, W, 4), dtype=np.float32)
    bg[..., :3] = (0.07, 0.08, 0.12)
    bg[..., 3] = 1
    for i, n in enumerate(names):
        img = bpy.data.images.load(os.path.join(OUT, n + ".webp"))
        grid = np.array(img.pixels[:], dtype=np.float32).reshape(img.size[1], img.size[0], 4)
        GH = grid.shape[0]
        bpy.data.images.remove(img)
        r, c = divmod(i, cols)
        # frame 24 = wajah menghadap kamera, frame 28 = tampak tiga perempat
        for k, f in enumerate((24, 28)):
            fr_r, fr_c = divmod(f, COLS)
            fr = grid[GH - (fr_r + 1) * SIZE:GH - fr_r * SIZE, fr_c * SIZE:(fr_c + 1) * SIZE]
            y0 = H - (r + 1) * cell
            x0 = (c * 2 + k) * cell
            dst = bg[y0:y0 + cell, x0:x0 + cell]
            a = fr[..., 3:4]
            dst[..., :3] = fr[..., :3] * a + dst[..., :3] * (1 - a)
    out = bpy.data.images.new("preview", W, H, alpha=True)
    out.pixels[:] = bg.ravel()
    p = os.path.join(tempfile.gettempdir(), "watchsball_preview.png")
    out.filepath_raw = p
    out.file_format = "PNG"
    out.save()
    print("preview:%s" % p)


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = setup_scene()
    names = ONLY or list(BUILDERS)
    for n in names:
        if n == "blade":
            render_blade(scene)
        else:
            render_ball(scene, n)
    if not ONLY:
        render_blade(scene)
    save_preview([n for n in names if n in BUILDERS])


main()
