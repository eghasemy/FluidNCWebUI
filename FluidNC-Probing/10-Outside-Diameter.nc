; Probe Outside Diameter
; #<_o_diameter> needs to be set before using this!

#<_centre> = [#<_i_diameter> / 2] - [#<_probe_diameter> / 2]
#<_clearance> = [#<_i_diameter>] + [#<_xy_clearance>]
#<_centre> = [#<_i_diameter>] + [#<_xy_clearance>] + [#<_probe_diameter> / 2]

G91      ; relative mode

;(--- 1 PROBE X ---)

; Pull away from edge in X- by #<_clearance>
G1 X[-#<_clearance>] F[#<_rapid_fr>]

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

; Return to centre
G1 X[+#<_probe_clearance>] F[#<_rapid_fr>]

; Pull away from edge in X+ by #<_clearance>
G1 X[+#<_clearance>] F[#<_rapid_fr>]

; Move Z down by #<_probing_depth>
G1 Z[-#<_probing_depth>] F[#<_rapid_fr>]
 
; Probe X- (search + latch)
G38.2 X-#<_probing_dist>] F[#<_search_fr>]   ; search pass
G1 X[+#<_latch_dist>] F[#<_rapid_fr>]      ; back off
G38.2 X[-#<_latch_dist>] F[#<_latch_fr>]   ; latch pass

; Retract X
G1 X[+#<_xy_clearance>] F[#<_rapid_fr>]

; Move Z up
G1 Z[+#<_probing_depth>] F[#<_rapid_fr>]

; Return to centre
G1 X[-#<_probe_clearance>] F[#<_rapid_fr>]

;(--- 2 PROBE Y ---)

; Pull away from edge in Y- by #<_clearance>
G1 Y[-#<_clearance>] F[#<_rapid_fr>]

; Move Z down by #<_probing_depth>
G1 Z[-#<_probing_depth>] F[#<_rapid_fr>]
 
; Probe Y+ (search + latch)
G38.2 Y[+#<_probing_dist>] F[#<_search_fr>]   ; search pass
G1 Y[-#<_latch_dist>] F[#<_rapid_fr>]      ; back off
G38.2 Y[+#<_latch_dist>] F[#<_latch_fr>]   ; latch pass

; Retract Y
G1 Y[-#<_xy_clearance>] F[#<_rapid_fr>]

; Move Z up
G1 Z[+#<_probing_depth>] F[#<_rapid_fr>]

; Return to centre
G1 Y[+#<_probe_clearance>] F[#<_rapid_fr>]

; Pull away from edge in Y+ by #<_clearance>
G1 Y[+#<_clearance>] F[#<_rapid_fr>]

; Move Z down by #<_probing_depth>
G1 Z[-#<_probing_depth>] F[#<_rapid_fr>]
 
; Probe Y- (search + latch)
G38.2 Y-#<_probing_dist>] F[#<_search_fr>]   ; search pass
G1 Y[+#<_latch_dist>] F[#<_rapid_fr>]      ; back off
G38.2 Y[-#<_latch_dist>] F[#<_latch_fr>]   ; latch pass

; Retract Y
G1 Y[+#<_xy_clearance>] F[#<_rapid_fr>]

; Move Z up
G1 Z[+#<_probing_depth>] F[#<_rapid_fr>]

; Return to centre
G1 Y[-#<_probe_clearance>] F[#<_rapid_fr>]

;(--- 3 FINISH PROBING SEQUENCE ---)

; Finally zero out
G10 L20 P0 X0 Y0
G90