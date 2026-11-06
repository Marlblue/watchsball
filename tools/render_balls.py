"""Render sprite bola Watchsball dengan Blender (headless).

Pakai:
  blender --background --factory-startup --python tools/render_balls.py -- <folder_output> [tipe1,tipe2,...]

Hasil per bola: <tipe>.webp = grid COLS kolom berisi FRAMES frame (SIZE x SIZE), bola diputar 360 derajat searah jarum jam dilihat dari atas (frame 0 = posisi awal model).
Plus pedang_blade.png = sprite pedang tampak atas (mengarah ke +X).
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


# ---------------------------------------------------------------- bola
def build_karet():
    mat, nt, b = principled("MAT-karet", (1.0, 0.22, 0.5), rough=0.42, coat=0.35)
    _, sep = obj_coords(nt)
    bx = math_node(nt, "LESS_THAN", math_node(nt, "ABSOLUTE", sep.outputs["X"]), 0.11)
    by = math_node(nt, "LESS_THAN", math_node(nt, "ABSOLUTE", sep.outputs["Y"]), 0.11)
    band = math_node(nt, "MAXIMUM", bx, by)
    mix_color(nt, band, (1.0, 0.22, 0.5), (0.42, 0.04, 0.2), b.inputs["Base Color"])
    noise = node(nt, "ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 40
    add_bump(nt, b, noise.outputs["Fac"], 0.06)
    s = sphere("GEO-ball")
    assign(s, mat)
    return [s]


def build_es():
    mat, nt, b = principled("MAT-es", (0.12, 0.6, 0.9), rough=0.15, coat=1.0)
    vor = node(nt, "ShaderNodeTexVoronoi", feature="DISTANCE_TO_EDGE")
    vor.inputs["Scale"].default_value = 1.8
    crack = math_node(nt, "LESS_THAN", vor.outputs["Distance"], 0.018)
    mix_color(nt, crack, (0.12, 0.6, 0.9), (0.85, 0.98, 1.0), b.inputs["Base Color"])
    set_input(b, "Emission Color", (0.6, 0.95, 1.0, 1))
    em = math_node(nt, "MULTIPLY", crack, 0.8)
    nt.links.new(em, b.inputs["Emission Strength"])
    noise = node(nt, "ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 6
    add_bump(nt, b, noise.outputs["Fac"], 0.25)
    s = sphere("GEO-ball")
    assign(s, mat)
    # serpihan kristal kecil
    import mathutils
    parts = [s]
    shard = principled("MAT-es-shard", (0.75, 0.95, 1.0), rough=0.08, coat=1.0, emis=(0.5, 0.9, 1.0), emis_str=0.6)[0]
    for i, (th, ph) in enumerate([(0.3, 0.5), (2.4, 0.7), (4.2, 0.6), (5.4, 1.0), (1.3, 1.1), (3.3, 0.25)]):
        d = mathutils.Vector((math.cos(th) * math.sin(ph), math.sin(th) * math.sin(ph), math.cos(ph)))
        c = cone("GEO-shard%d" % i, 0.16, 0.5, d * 0.95, d)
        assign(c, shard)
        parts.append(c)
    return parts


def build_api():
    mat, nt, b = principled("MAT-api", (0.05, 0.02, 0.015), rough=0.85)
    vor = node(nt, "ShaderNodeTexVoronoi", feature="DISTANCE_TO_EDGE")
    vor.inputs["Scale"].default_value = 3.0
    # retakan tipis yang terang di tengah, memudar ke batu
    ramp = node(nt, "ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (1, 1, 1, 1)
    ramp.color_ramp.elements[1].position = 0.045
    ramp.color_ramp.elements[1].color = (0, 0, 0, 1)
    nt.links.new(vor.outputs["Distance"], ramp.inputs["Fac"])
    set_input(b, "Emission Color", (1.0, 0.22, 0.02, 1))
    em = math_node(nt, "MULTIPLY", ramp.outputs["Color"], 4.0)
    nt.links.new(em, b.inputs["Emission Strength"])
    mix_color(nt, ramp.outputs["Color"], (0.07, 0.025, 0.015), (1.0, 0.3, 0.03), b.inputs["Base Color"])
    noise = node(nt, "ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 8
    add_bump(nt, b, noise.outputs["Fac"], 0.5)
    s = sphere("GEO-ball")
    assign(s, mat)
    return [s]


def build_pedang():
    mat, nt, b = principled("MAT-pedang", (0.75, 0.06, 0.09), rough=0.28, metal=0.75, coat=0.4)
    _, sep = obj_coords(nt)
    band = math_node(nt, "LESS_THAN", math_node(nt, "ABSOLUTE", sep.outputs["X"]), 0.09)
    mix_color(nt, band, (0.75, 0.06, 0.09), (1.0, 0.72, 0.22), b.inputs["Base Color"])
    noise = node(nt, "ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 30
    add_bump(nt, b, noise.outputs["Fac"], 0.05)
    s = sphere("GEO-ball")
    assign(s, mat)
    return [s]


def build_petir():
    mat, nt, b = principled("MAT-petir", (1.0, 0.72, 0.04), rough=0.3, metal=0.35, coat=0.6)
    noise = node(nt, "ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 2.2
    noise.inputs["Detail"].default_value = 6
    ramp = node(nt, "ShaderNodeValToRGB")
    els = ramp.color_ramp.elements
    els[0].position = 0.47
    els[0].color = (0, 0, 0, 1)
    els[1].position = 0.5
    els[1].color = (1, 1, 1, 1)
    e3 = els.new(0.53)
    e3.color = (0, 0, 0, 1)
    nt.links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    set_input(b, "Emission Color", (1.0, 1.0, 0.75, 1))
    em = math_node(nt, "MULTIPLY", ramp.outputs["Color"], 7.0)
    nt.links.new(em, b.inputs["Emission Strength"])
    mix_color(nt, ramp.outputs["Color"], (0.95, 0.62, 0.02), (1, 1, 0.85), b.inputs["Base Color"])
    s = sphere("GEO-ball")
    assign(s, mat)
    return [s]


def build_vampir():
    mat, nt, b = principled("MAT-vampir", (0.32, 0.0, 0.06), rough=0.32, coat=1.0)
    set_input(b, "Subsurface Weight", 0.25)
    s = sphere("GEO-ball")
    assign(s, mat)
    parts = [s]
    fang = principled("MAT-fang", (0.97, 0.95, 0.9), rough=0.25, coat=0.5)[0]
    eye = principled("MAT-eye", (1, 0.1, 0.1), rough=0.3, emis=(1.0, 0.1, 0.05), emis_str=14)[0]
    brow = principled("MAT-brow", (0.08, 0.0, 0.02), rough=0.5)[0]
    import mathutils
    # wajah menghadap kamera yang miring dari atas: posisinya di lintang atas
    face = mathutils.Vector((0, -0.62, 0.78)).normalized()
    for sx in (-1, 1):
        ed = mathutils.Vector((sx * 0.32, -0.55, 0.77)).normalized()
        e = sphere("GEO-eye", 0.15, tuple(ed * 0.95), 24, 12)
        e.scale = (1.0, 0.75, 0.55)
        e.rotation_euler = ed.to_track_quat("Z", "Y").to_euler()
        assign(e, eye)
        # alis miring, bikin kelihatan galak
        bpy.ops.mesh.primitive_cube_add(size=1, location=tuple(mathutils.Vector((sx * 0.3, -0.42, 0.86)).normalized() * 1.0))
        br = bpy.context.active_object
        br.scale = (0.26, 0.05, 0.05)
        br.rotation_euler = (math.radians(-30), 0, math.radians(-22 * sx))
        assign(br, brow)
        fd = mathutils.Vector((sx * 0.17, -0.86, 0.4)).normalized()
        f = cone("GEO-fang", 0.08, 0.34, fd * 0.98, (fd + mathutils.Vector((0, 0, -1.4))).normalized())
        assign(f, fang)
        parts += [f, e, br]
    return parts


def build_raksasa():
    mat, nt, b = principled("MAT-raksasa", (0.2, 0.55, 0.18), rough=0.9)
    noise = node(nt, "ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 3.0
    noise.inputs["Detail"].default_value = 8
    ramp = node(nt, "ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.45
    ramp.color_ramp.elements[1].position = 0.6
    nt.links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    mix_color(nt, ramp.outputs["Color"], (0.16, 0.14, 0.12), (0.08, 0.38, 0.06), b.inputs["Base Color"])
    detail = node(nt, "ShaderNodeTexNoise")
    detail.inputs["Scale"].default_value = 9
    detail.inputs["Detail"].default_value = 10
    add_bump(nt, b, detail.outputs["Fac"], 0.9)
    s = sphere("GEO-ball")
    assign(s, mat)
    return [s]


def build_bom():
    mat, nt, b = principled("MAT-bom", (0.06, 0.06, 0.07), rough=0.3, metal=0.8, coat=0.5)
    noise = node(nt, "ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 25
    add_bump(nt, b, noise.outputs["Fac"], 0.08)
    s = sphere("GEO-ball")
    assign(s, mat)
    capm = principled("MAT-cap", (0.55, 0.55, 0.58), rough=0.35, metal=1.0)[0]
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.3, depth=0.25, location=(0, 0, 1.0))
    cap = bpy.context.active_object
    cap.name = "GEO-cap"
    assign(cap, capm)
    # sumbu
    cu = bpy.data.curves.new("CRV-fuse", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = 0.055
    sp = cu.splines.new("BEZIER")
    sp.bezier_points.add(2)
    pts = [(0, 0, 1.1), (0.12, 0.05, 1.4), (0.38, 0.12, 1.5)]
    for bp, p in zip(sp.bezier_points, pts):
        bp.co = p
        bp.handle_left_type = bp.handle_right_type = "AUTO"
    fuse = bpy.data.objects.new("GEO-fuse", cu)
    bpy.context.scene.collection.objects.link(fuse)
    fuse.data.materials.append(principled("MAT-fuse", (0.6, 0.45, 0.25), rough=0.9)[0])
    spark = sphere("GEO-spark", 0.17, (0.4, 0.12, 1.5), 16, 8)
    assign(spark, principled("MAT-spark", (1, 0.6, 0.1), emis=(1.0, 0.45, 0.05), emis_str=8)[0])
    return [s, cap, fuse, spark]


def build_duri():
    mat, nt, b = principled("MAT-duri", (0.5, 0.8, 0.18), rough=0.45, coat=0.3)
    s = sphere("GEO-ball", 0.88)
    assign(s, mat)
    spike = principled("MAT-spike", (0.2, 0.35, 0.05), rough=0.35, coat=0.6)[0]
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1.0)
    ico = bpy.context.active_object
    dirs = [v.co.normalized() for v in ico.data.vertices]
    bpy.data.objects.remove(ico, do_unlink=True)
    parts = [s]
    for i, d in enumerate(dirs):
        c = cone("GEO-spike%d" % i, 0.14, 0.42, d * 0.98, d)
        assign(c, spike)
        parts.append(c)
    return parts


def build_kembar():
    mat, nt, b = principled("MAT-kembar", (0.6, 0.4, 1.0), rough=0.25, coat=0.8)
    _, sep = obj_coords(nt)
    wave = math_node(nt, "MULTIPLY", math_node(nt, "SINE", math_node(nt, "MULTIPLY", sep.outputs["X"], math.pi)), 0.4)
    side = math_node(nt, "GREATER_THAN", math_node(nt, "SUBTRACT", sep.outputs["Y"], wave), 0.0)
    mix_color(nt, side, (0.3, 0.1, 0.62), (0.86, 0.76, 1.0), b.inputs["Base Color"])
    s = sphere("GEO-ball")
    assign(s, mat)
    return [s]


def build_racun():
    mat, nt, b = principled("MAT-racun", (0.42, 0.85, 0.1), rough=0.25, coat=0.8)
    vor = node(nt, "ShaderNodeTexVoronoi")
    vor.inputs["Scale"].default_value = 4.0
    spot = math_node(nt, "LESS_THAN", vor.outputs["Distance"], 0.22)
    mix_color(nt, spot, (0.42, 0.85, 0.1), (0.35, 0.08, 0.45), b.inputs["Base Color"])
    set_input(b, "Emission Color", (0.5, 1.0, 0.2, 1))
    set_input(b, "Emission Strength", 0.25)
    s = sphere("GEO-ball")
    assign(s, mat)
    bub = principled("MAT-bubble", (0.6, 1.0, 0.3), rough=0.05, coat=1.0, emis=(0.5, 1.0, 0.2), emis_str=1.2)[0]
    import mathutils
    parts = [s]
    for i, (d, r) in enumerate([((0.3, -0.2, 0.93), 0.17), ((-0.35, 0.25, 0.9), 0.12), ((0.1, 0.45, 0.88), 0.09), ((-0.55, -0.35, 0.76), 0.1)]):
        v = mathutils.Vector(d).normalized()
        o = sphere("GEO-bub%d" % i, r, tuple(v * 1.0), 24, 12)
        assign(o, bub)
        parts.append(o)
    return parts


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


def build_jamur():
    mat, nt, b = principled("MAT-jamur", (0.86, 0.1, 0.08), rough=0.35, coat=0.6)
    vor = node(nt, "ShaderNodeTexVoronoi")
    vor.inputs["Scale"].default_value = 3.2
    spot = math_node(nt, "LESS_THAN", vor.outputs["Distance"], 0.2)
    mix_color(nt, spot, (0.86, 0.1, 0.08), (0.98, 0.95, 0.88), b.inputs["Base Color"])
    add_bump(nt, b, spot, 0.15)
    s = sphere("GEO-ball")
    assign(s, mat)
    return [s]


def build_magnet():
    mat, nt, b = principled("MAT-magnet", (0.85, 0.1, 0.12), rough=0.3, metal=0.35, coat=0.6)
    _, sep = obj_coords(nt)
    side = math_node(nt, "GREATER_THAN", sep.outputs["X"], 0.0)
    band = math_node(nt, "LESS_THAN", math_node(nt, "ABSOLUTE", sep.outputs["X"]), 0.12)
    mx = mix_color(nt, side, (0.12, 0.3, 0.9), (0.88, 0.1, 0.12), b.inputs["Base Color"])
    mx2 = node(nt, "ShaderNodeMix", data_type="RGBA")
    nt.links.new(band, mx2.inputs["Factor"])
    nt.links.new(mx.outputs["Result"], mx2.inputs["A"])
    mx2.inputs["B"].default_value = (0.85, 0.86, 0.9, 1)
    nt.links.new(mx2.outputs["Result"], b.inputs["Base Color"])
    s = sphere("GEO-ball")
    assign(s, mat)
    return [s]


def build_meriam():
    mat, nt, b = principled("MAT-meriam", (0.22, 0.26, 0.3), rough=0.35, metal=0.85)
    noise = node(nt, "ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 20
    add_bump(nt, b, noise.outputs["Fac"], 0.1)
    s = sphere("GEO-ball")
    assign(s, mat)
    brass = principled("MAT-brass", (0.85, 0.6, 0.25), rough=0.3, metal=1.0)[0]
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.24, depth=0.9, location=(1.0, 0, 0.35), rotation=(0, math.pi / 2, 0))
    barrel = bpy.context.active_object
    barrel.name = "GEO-barrel"
    bpy.ops.object.shade_smooth()
    assign(barrel, mat)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.25, minor_radius=0.06, location=(1.43, 0, 0.35), rotation=(0, math.pi / 2, 0))
    rim = bpy.context.active_object
    assign(rim, brass)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.98, minor_radius=0.06, location=(0, 0, 0.18))
    ring = bpy.context.active_object
    assign(ring, brass)
    return [s, barrel, rim, ring]


def build_tawon():
    mat, nt, b = principled("MAT-tawon", (1.0, 0.72, 0.02), rough=0.35, coat=0.5)
    _, sep = obj_coords(nt)
    stripe = math_node(nt, "GREATER_THAN", math_node(nt, "SINE", math_node(nt, "MULTIPLY", sep.outputs["X"], 9.0)), 0.25)
    mix_color(nt, stripe, (1.0, 0.72, 0.02), (0.05, 0.04, 0.03), b.inputs["Base Color"])
    noise = node(nt, "ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 60
    add_bump(nt, b, noise.outputs["Fac"], 0.12)
    s = sphere("GEO-ball")
    assign(s, mat)
    wing = principled("MAT-wing", (0.55, 0.7, 0.85), rough=0.15, transmission=0.4, emis=(0.6, 0.8, 1.0), emis_str=0.08)[0]
    parts = [s]
    for sy in (-1, 1):
        w = sphere("GEO-wing", 0.36, (-0.25, sy * 0.38, 0.98), 24, 12)
        w.scale = (0.5, 1.0, 0.1)
        w.rotation_euler = (sy * math.radians(-20), 0, 0)
        assign(w, wing)
        parts.append(w)
    return parts


def build_hantu():
    mat, nt, b = principled("MAT-hantu", (0.62, 0.66, 0.85), rough=0.5, emis=(0.55, 0.6, 1.0), emis_str=0.15)
    set_input(b, "Subsurface Weight", 0.5)
    s = sphere("GEO-ball")
    assign(s, mat)
    dark = principled("MAT-hantu-eye", (0.03, 0.03, 0.08), rough=0.2, coat=1.0)[0]
    import mathutils
    parts = [s]
    for sx in (-1, 1):
        d = mathutils.Vector((sx * 0.3, -0.5, 0.81)).normalized()
        e = sphere("GEO-eye", 0.22, tuple(d * 0.95), 24, 12)
        e.scale = (0.8, 0.6, 1.3)
        e.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
        assign(e, dark)
        parts.append(e)
    m = mathutils.Vector((0, -0.8, 0.6)).normalized()
    mouth = sphere("GEO-mouth", 0.12, tuple(m * 0.97), 24, 12)
    mouth.scale = (1.0, 0.5, 1.3)
    mouth.rotation_euler = m.to_track_quat("Z", "Y").to_euler()
    assign(mouth, dark)
    parts.append(mouth)
    return parts


def build_laser():
    mat, nt, b = principled("MAT-laser", (0.04, 0.03, 0.06), rough=0.15, metal=0.6, coat=1.0)
    s = sphere("GEO-ball")
    assign(s, mat)
    glow = principled("MAT-laser-glow", (1, 0.15, 0.5), emis=(1.0, 0.08, 0.45), emis_str=3)[0]
    bpy.ops.mesh.primitive_torus_add(major_radius=1.0, minor_radius=0.08, location=(0, 0, 0))
    ring = bpy.context.active_object
    assign(ring, glow)
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.28, depth=0.14, location=(0.96, 0, 0.25), rotation=(0, math.pi / 2, 0))
    lens = bpy.context.active_object
    assign(lens, glow)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.32, minor_radius=0.05, location=(0.98, 0, 0.25), rotation=(0, math.pi / 2, 0))
    lens_rim = bpy.context.active_object
    assign(lens_rim, principled("MAT-chrome", (0.9, 0.9, 0.95), rough=0.1, metal=1.0)[0])
    return [s, ring, lens, lens_rim]


def build_portal():
    mat, nt, b = principled("MAT-portal", (0.03, 0.18, 0.2), rough=0.2, coat=1.0)
    wave = node(nt, "ShaderNodeTexWave", wave_type="RINGS")
    wave.inputs["Scale"].default_value = 2.2
    wave.inputs["Distortion"].default_value = 6.0
    wave.inputs["Detail"].default_value = 3.0
    ramp = node(nt, "ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.55
    ramp.color_ramp.elements[1].position = 0.85
    nt.links.new(wave.outputs["Fac"], ramp.inputs["Fac"])
    set_input(b, "Emission Color", (0.2, 1.0, 0.85, 1))
    em = math_node(nt, "MULTIPLY", ramp.outputs["Color"], 5.0)
    nt.links.new(em, b.inputs["Emission Strength"])
    mix_color(nt, ramp.outputs["Color"], (0.03, 0.18, 0.2), (0.4, 1.0, 0.9), b.inputs["Base Color"])
    s = sphere("GEO-ball")
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


def build_bunga():
    import mathutils
    mat, nt, b = principled("MAT-bunga", (0.95, 0.45, 0.7), rough=0.4, coat=0.5)
    s = sphere("GEO-ball", 0.92)
    assign(s, mat)
    petal = principled("MAT-petal", (1.0, 0.72, 0.86), rough=0.35, coat=0.6, emis=(1.0, 0.6, 0.8), emis_str=0.15)[0]
    core = principled("MAT-core", (1.0, 0.8, 0.15), rough=0.5)[0]
    parts = [s]
    for i in range(8):
        a = i / 8 * math.pi * 2
        d = mathutils.Vector((math.cos(a) * 0.62, math.sin(a) * 0.62, 0.72))
        p = sphere("GEO-petal%d" % i, 0.42, tuple(d), 24, 12)
        p.scale = (1.0, 0.55, 0.16)
        p.rotation_euler = (0, -math.radians(38), a)
        assign(p, petal)
        parts.append(p)
    c = sphere("GEO-core", 0.32, (0, 0, 0.88), 24, 12)
    c.scale = (1, 1, 0.55)
    assign(c, core)
    parts.append(c)
    return parts


def build_angin():
    mat, nt, b = principled("MAT-angin", (0.7, 0.9, 0.95), rough=0.2, coat=1.0)
    wave = node(nt, "ShaderNodeTexWave")
    wave.inputs["Scale"].default_value = 1.6
    wave.inputs["Distortion"].default_value = 8.0
    band = math_node(nt, "GREATER_THAN", wave.outputs["Fac"], 0.62)
    mix_color(nt, band, (0.55, 0.82, 0.92), (1, 1, 1), b.inputs["Base Color"])
    s = sphere("GEO-ball")
    assign(s, mat)
    ring = principled("MAT-gust", (1, 1, 1), rough=0.2, emis=(0.85, 0.95, 1.0), emis_str=0.8)[0]
    parts = [s]
    for i, (rx, rz) in enumerate([(25, 0), (-35, 60), (70, 120)]):
        bpy.ops.mesh.primitive_torus_add(major_radius=1.08, minor_radius=0.035, location=(0, 0, 0))
        t = bpy.context.active_object
        t.rotation_euler = (math.radians(rx), 0, math.radians(rz))
        assign(t, ring)
        parts.append(t)
    return parts


def build_gelembung():
    core_m = principled("MAT-gel-core", (0.15, 0.5, 0.95), rough=0.2, coat=1.0, emis=(0.3, 0.7, 1.0), emis_str=0.3)[0]
    s = sphere("GEO-ball", 0.9)
    assign(s, core_m)
    mat, nt, b = principled("MAT-bubble", (0.75, 0.95, 1.0), rough=0.03, coat=1.0)
    set_input(b, "Alpha", 0.28)
    lw = node(nt, "ShaderNodeLayerWeight")
    lw.inputs["Blend"].default_value = 0.25
    set_input(b, "Emission Color", (0.7, 0.85, 1.0, 1))
    nt.links.new(math_node(nt, "MULTIPLY", lw.outputs["Fresnel"], 1.4), b.inputs["Emission Strength"])
    for attr, val in (("surface_render_method", "BLENDED"), ("blend_method", "BLEND")):
        try:
            setattr(mat, attr, val)
        except (AttributeError, TypeError):
            pass
    return [s]  # perisai gelembung digambar di game (bisa pecah & tumbuh lagi)


def build_cermin():
    mat, nt, b = principled("MAT-cermin", (0.78, 0.84, 0.95), rough=0.18, metal=0.55, coat=1.0)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.0)
    s = bpy.context.active_object
    s.name = "GEO-ball"
    bpy.ops.object.shade_flat()  # bidang-bidang kaca yang memantulkan cahaya
    assign(s, mat)
    return [s]


def build_bintang():
    import mathutils
    mat, nt, b = principled("MAT-bintang", (1.0, 0.78, 0.15), rough=0.25, metal=0.4, coat=0.8, emis=(1.0, 0.7, 0.1), emis_str=0.25)
    s = sphere("GEO-ball", 0.85)
    assign(s, mat)
    tip = principled("MAT-star-tip", (1.0, 0.92, 0.5), rough=0.2, metal=0.3, emis=(1.0, 0.85, 0.3), emis_str=0.8)[0]
    parts = [s]
    for i in range(5):
        a = i / 5 * math.pi * 2
        d = mathutils.Vector((math.cos(a), math.sin(a), 0.15)).normalized()
        c = cone("GEO-point%d" % i, 0.3, 0.6, d * 0.85, d)
        assign(c, tip)
        parts.append(c)
    return parts


def build_naga():
    import mathutils
    mat, nt, b = principled("MAT-naga", (0.12, 0.62, 0.32), rough=0.35, coat=0.6)
    vor = node(nt, "ShaderNodeTexVoronoi")
    vor.inputs["Scale"].default_value = 9
    add_bump(nt, b, vor.outputs["Distance"], 0.5)
    mix_color(nt, vor.outputs["Distance"], (0.05, 0.4, 0.2), (0.35, 0.85, 0.4), b.inputs["Base Color"])
    s = sphere("GEO-ball")
    assign(s, mat)
    horn = principled("MAT-horn", (0.95, 0.85, 0.6), rough=0.4)[0]
    eye = principled("MAT-naga-eye", (1, 0.85, 0.1), emis=(1.0, 0.75, 0.05), emis_str=6)[0]
    parts = [s]
    # moncong menghadap +X
    snout = sphere("GEO-snout", 0.42, (0.95, 0, 0.12), 32, 16)
    snout.scale = (1.0, 0.8, 0.6)
    assign(snout, mat)
    parts.append(snout)
    for sy in (-1, 1):
        h = cone("GEO-horn", 0.12, 0.5, mathutils.Vector((-0.2, sy * 0.4, 0.9)), mathutils.Vector((-0.6, sy * 0.3, 1)).normalized())
        assign(h, horn)
        parts.append(h)
    return parts


def build_bayangan():
    mat, nt, b = principled("MAT-bayangan", (0.02, 0.015, 0.04), rough=0.45, coat=0.2)
    lw = node(nt, "ShaderNodeLayerWeight")
    lw.inputs["Blend"].default_value = 0.4
    set_input(b, "Emission Color", (0.55, 0.25, 1.0, 1))
    nt.links.new(math_node(nt, "MULTIPLY", math_node(nt, "POWER", lw.outputs["Fresnel"], 3.0), 2.5), b.inputs["Emission Strength"])
    s = sphere("GEO-ball")
    assign(s, mat)
    eye = principled("MAT-shadow-eye", (1, 0.3, 1), emis=(1.0, 0.35, 1.0), emis_str=10)[0]
    parts = [s]
    for sy in (-1, 1):  # mata menghadap +X
        e = sphere("GEO-eye", 0.14, (0.82, sy * 0.3, 0.45), 16, 8)
        e.scale = (0.5, 1.0, 0.6)
        assign(e, eye)
        parts.append(e)
    return parts


def build_petasan():
    mat, nt, b = principled("MAT-petasan", (0.9, 0.12, 0.08), rough=0.3, coat=0.8)
    tc, sep = obj_coords(nt)
    ang = node(nt, "ShaderNodeMath", operation="ARCTAN2")
    nt.links.new(sep.outputs["Y"], ang.inputs[0])
    nt.links.new(sep.outputs["X"], ang.inputs[1])
    swirl = math_node(nt, "SINE", math_node(nt, "ADD", math_node(nt, "MULTIPLY", sep.outputs["Z"], 7.0), math_node(nt, "MULTIPLY", ang.outputs[0], 3.0)))
    stripe = math_node(nt, "GREATER_THAN", swirl, 0.2)
    mix_color(nt, stripe, (0.92, 0.12, 0.08), (1.0, 0.92, 0.6), b.inputs["Base Color"])
    s = sphere("GEO-ball")
    assign(s, mat)
    cu = bpy.data.curves.new("CRV-fuse2", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = 0.05
    sp = cu.splines.new("BEZIER")
    sp.bezier_points.add(1)
    for bp, p in zip(sp.bezier_points, [(0, 0, 0.95), (0.1, -0.15, 1.35)]):
        bp.co = p
        bp.handle_left_type = bp.handle_right_type = "AUTO"
    fuse = bpy.data.objects.new("GEO-fuse", cu)
    bpy.context.scene.collection.objects.link(fuse)
    fuse.data.materials.append(principled("MAT-fuse2", (0.3, 0.25, 0.2), rough=0.9)[0])
    spark = sphere("GEO-spark", 0.14, (0.1, -0.15, 1.38), 16, 8)
    assign(spark, principled("MAT-spark2", (1, 0.7, 0.2), emis=(1.0, 0.6, 0.15), emis_str=8)[0])
    return [s, fuse, spark]


def build_meteor():
    mat, nt, b = principled("MAT-meteor", (0.18, 0.13, 0.1), rough=0.9)
    vor = node(nt, "ShaderNodeTexVoronoi")
    vor.inputs["Scale"].default_value = 3.5
    crater = math_node(nt, "LESS_THAN", vor.outputs["Distance"], 0.25)
    add_bump(nt, b, math_node(nt, "MULTIPLY", crater, -1.0), 0.6)
    _, sep = obj_coords(nt)
    # sisi depan (+X) membara karena gesekan
    heat = node(nt, "ShaderNodeMapRange")
    nt.links.new(sep.outputs["X"], heat.inputs["Value"])
    heat.inputs["From Min"].default_value = -0.3
    heat.inputs["From Max"].default_value = 1.0
    set_input(b, "Emission Color", (1.0, 0.35, 0.05, 1))
    nt.links.new(math_node(nt, "MULTIPLY", math_node(nt, "POWER", heat.outputs["Result"], 2.0), 3.0), b.inputs["Emission Strength"])
    heat.interpolation_type = "SMOOTHERSTEP"
    mix_color(nt, heat.outputs["Result"], (0.12, 0.09, 0.07), (0.9, 0.3, 0.05), b.inputs["Base Color"])
    s = sphere("GEO-ball", 0.95)
    tex = bpy.data.textures.new("TEX-meteor", "VORONOI")
    tex.noise_scale = 0.6
    disp = s.modifiers.new("DSP-meteor", "DISPLACE")
    disp.texture = tex
    disp.strength = 0.1
    assign(s, mat)
    return [s]


def build_matahari():
    import mathutils
    mat, nt, b = principled("MAT-matahari", (1.0, 0.5, 0.02), rough=0.6, emis=(1.0, 0.35, 0.02), emis_str=0.6)
    noise = node(nt, "ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 7
    noise.inputs["Detail"].default_value = 6
    mix_color(nt, noise.outputs["Fac"], (0.95, 0.25, 0.02), (1.0, 0.75, 0.15), b.inputs["Base Color"])
    nt.links.new(math_node(nt, "MULTIPLY", noise.outputs["Fac"], 0.9), b.inputs["Emission Strength"])
    s = sphere("GEO-ball", 0.85)
    assign(s, mat)
    ray = principled("MAT-ray", (1.0, 0.6, 0.1), emis=(1.0, 0.45, 0.05), emis_str=0.8)[0]
    parts = [s]
    for i in range(12):
        a = i / 12 * math.pi * 2
        d = mathutils.Vector((math.cos(a), math.sin(a), 0.25)).normalized()
        c = cone("GEO-ray%d" % i, 0.13, 0.42 if i % 2 else 0.3, d * 0.86, d)
        assign(c, ray)
        parts.append(c)
    return parts


BUILDERS = {
    "karet": build_karet, "es": build_es, "api": build_api, "pedang": build_pedang, "petir": build_petir,
    "vampir": build_vampir, "raksasa": build_raksasa, "bom": build_bom, "duri": build_duri, "kembar": build_kembar,
    "racun": build_racun, "batu": build_batu, "jamur": build_jamur, "magnet": build_magnet, "meriam": build_meriam,
    "tawon": build_tawon, "hantu": build_hantu, "laser": build_laser, "portal": build_portal, "lubang": build_lubang,
    "bunga": build_bunga, "angin": build_angin, "gelembung": build_gelembung, "cermin": build_cermin, "bintang": build_bintang,
    "naga": build_naga, "bayangan": build_bayangan, "petasan": build_petasan, "meteor": build_meteor, "matahari": build_matahari,
}


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
FACES = {
    "karet": ("happy", (0.85, 0.15, 0.45), 1.0, 0.6),
    "es": ("cute", (0.1, 0.45, 0.9), 1.0, 0.6),
    "api": ("fierce", (1.0, 0.45, 0.0), 1.0, 0.6),
    "pedang": ("fierce", (0.85, 0.1, 0.1), 1.0, 0.6),
    "petir": ("fierce", (0.95, 0.6, 0.0), 1.0, 0.6),
    "raksasa": ("grumpy", (0.2, 0.55, 0.1), 1.0, 0.6),
    "bom": ("cute", (0.9, 0.2, 0.1), 1.0, 0.52),
    "duri": ("angry", (0.3, 0.55, 0.0), 0.88, 0.6),
    "kembar": ("cute", (0.55, 0.25, 1.0), 1.0, 0.6),
    "racun": ("sly", (0.6, 0.1, 0.8), 1.0, 0.6),
    "batu": ("sleepy", (0.4, 0.3, 0.2), 1.08, 0.6),
    "jamur": ("sleepy", (0.75, 0.1, 0.1), 1.0, 0.52),
    "magnet": ("normal", (0.15, 0.3, 0.9), 1.0, 0.6),
    "meriam": ("angry", (0.95, 0.5, 0.1), 1.0, 0.75),
    "tawon": ("angry", (0.15, 0.1, 0.05), 1.0, 0.52),
    "bunga": ("cute", (0.85, 0.25, 0.55), 0.92, 0.35),
    "angin": ("happy", (0.15, 0.55, 0.8), 1.0, 0.6),
    "gelembung": ("cute", (0.1, 0.4, 0.95), 0.9, 0.6),
    "cermin": ("cool", (0.35, 0.45, 0.7), 1.0, 0.6),
    "bintang": ("excited", (1.0, 0.55, 0.0), 0.85, 0.6),
    "petasan": ("excited", (0.9, 0.1, 0.1), 1.0, 0.52),
    "meteor": ("angry", (1.0, 0.3, 0.0), 1.0, 0.6),
    "matahari": ("happy", (1.0, 0.35, 0.0), 0.85, 0.6),
    "naga": ("fierce", (1.0, 0.75, 0.0), 1.0, 0.62),
}
# bola yang wajah lamanya dibuat menghadap -Y: diputar 90 derajat supaya ikut aturan "wajah di +X"
ROT_FACE = {"vampir": math.pi / 2, "hantu": math.pi / 2}

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
    blade.scale = (2.6, 0.22, 0.05)
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
    guard.scale = (0.1, 0.62, 0.1)
    assign(guard, gold)
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.07, depth=0.55, location=(-1.1, 0, 0), rotation=(0, math.pi / 2, 0))
    grip = bpy.context.active_object
    assign(grip, leather)
    sphere("GEO-pommel", 0.1, (-1.42, 0, 0), 16, 8).data.materials.append(gold)
    p = os.path.join(OUT, "pedang_blade.png")
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
