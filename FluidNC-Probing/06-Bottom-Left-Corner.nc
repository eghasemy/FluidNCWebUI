; Probe Bottom-Left Corner

#<_probe_clearance> = [#<_xy_clearance>] - [#<_probe_diameter> / 2]

G91                         ; relative mode

(--- 1 PROBE X ---)
; a Pull away from corner in X- Y+ by #<_xy_clearance>
G1 X[-#<_xy_clearance>] Y[+#<_xy_clearance>] F[#<_rapid_fr>]

; Move Z down by #<_probing_depth>
G1 Z[-#<_probing_depth>] F[#<_rapid_fr>]

; Probe X+ (search + latch)
G38.2 X[+#<_probing_dist>] F[#<_search_fr>]   ; search pass
G1 X[-#<_latch_dist>] F[#<_rapid_fr>]      ; back off
G38.2 X[+#<_latch_dist>] F[#<_latch_fr>]   ; latch pass

; Retract X
G1 X[-#<_xy_clearance>] F[#<_rapid_fr>]

; Move Z up
G1 Z[+#<_probing_depth>] F[#<_rapid_fr>]

; Return to corner
G1 X[+#<_xy_clearance>*2] F[#<_rapid_fr>]

(--- 2 PROBE Y ---)
; Pull away again
G1 Y[-#<_xy_clearance>*2] F[#<_rapid_fr>]

; Z down
G1 Z[-#<_probing_depth>] F[#<_rapid_fr>]

; Probe Y+
G38.2 Y[+#<_probing_dist>] F[#<_search_fr>]
G1 Y[-#<_latch_dist>] F[#<_rapid_fr>]
G38.2 Y[+#<_latch_dist>] F[#<_latch_fr>]

; Retract
G1 Y[-#<_xy_clearance>] F[#<_rapid_fr>]

; Z up
G1 Z[+#<_probing_depth>] F[#<_rapid_fr>]

; Return to corner
G1 X[-#<_probe_clearance>] Y[+#<_probe_clearance>] F[#<_rapid_fr>]
; Finally zero out
G10 L20 P0 X0 Y0
G90