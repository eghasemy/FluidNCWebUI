; Probe Top-Edge

#<_probe_clearance> = [#<_xy_clearance>] - [#<_probe_diameter> / 2]

G91                         ; relative mode

(--- 1 PROBE Y ---)
; Pull away
G1 Y[+#<_xy_clearance>] F[#<_rapid_fr>]

; Z down
G1 Z[-#<_probing_depth>] F[#<_rapid_fr>]

; Probe Y-
G38.2 Y[-#<_probing_dist>] F[#<_search_fr>]
G1 Y[+#<_latch_dist>] F[#<_rapid_fr>]
G38.2 Y[-#<_latch_dist>] F[#<_latch_fr>]

; Retract
G1 Y[+#<_xy_clearance>] F[#<_rapid_fr>]

; Z up
G1 Z[+#<_probing_depth>] F[#<_rapid_fr>]

; Return to corner
G1 Y[-#<_probe_clearance>] F[#<_rapid_fr>]
; Finally zero out
G10 L20 P0 Y0
G90