; Probe Inside Diameter
; #<_i_diameter> needs to be set before using this!

#<_centre> = [#<_i_diameter> / 2] - [#<_probe_diameter> / 2]

G91      ; relative mode

(--- 1 PROBE X ---)

; Z down
G1 Z[-#<_probing_depth>] F[#<_rapid_fr>]

; Probe X+
G38.2 X[+#<_i_diameter>] F[#<_search_fr>]
G1 X[-#<_i_diameter>/2] F[#<_rapid_fr>]
G38.2 X[+#<_i_diameter>] F[#<_latch_fr>]

; Retract
G1 X[-#<_centre>] F[#<_rapid_fr>]

; Probe X-
G38.2 X[-#<_i_diameter>] F[#<_search_fr>]
G1 X[+#<_i_diameter>/2] F[#<_rapid_fr>]
G38.2 X[-#<_i_diameter>] F[#<_latch_fr>]

; Retract
G1 X[+#<_centre>] F[#<_rapid_fr>]

(--- 2 PROBE Y ---)

; Z down
G1 Z[-#<_probing_depth>] F[#<_rapid_fr>]

; Probe Y+
G38.2 Y[+#<_i_diameter>] F[#<_search_fr>]
G1 Y[-#<_i_diameter>/2] F[#<_rapid_fr>]
G38.2 Y[+#<_i_diameter>] F[#<_latch_fr>]

; Retract
G1 Y[-#<_centre>] F[#<_rapid_fr>]

; Probe Y-
G38.2 Y[-#<_i_diameter>] F[#<_search_fr>]
G1 Y[+#<_i_diameter>/2] F[#<_rapid_fr>]
G38.2 Y[-#<_i_diameter>] F[#<_latch_fr>]

; Retract
G1 Y[+#<_centre>] F[#<_rapid_fr>]

(--- 3 FINISH PROBING SEQUENCE ---)

; Finally zero out
G10 L20 P0 X0 Y0
G90