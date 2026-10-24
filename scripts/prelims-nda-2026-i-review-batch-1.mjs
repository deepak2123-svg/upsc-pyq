// Staging only. These first-pass decisions do not publish questions or approve keys.
const P='Science & Technology/Physics/';
const row=(number,page,placement,promptLines,options,proposedAnswer,reasoning,evidenceIds,caveat=null)=>({number,page,placement:P+placement,promptLines,options:Object.fromEntries(options.map((value,index)=>['ABCD'[index],value])),proposedAnswer,reasoning,evidenceIds,caveat,reproductionStatus:'first-pass-original-visual-transcription',answerStatus:caveat?'needs-ambiguity-review':'first-pass-reasoning',secondPassStatus:'pending',publicationEligible:false});
export const nda2026IBatch1=[
 row(51,9,'Heat and Waves/Wave properties',[
  'A pendulum of length L oscillates with an angular amplitude of θ = 60° and time period T. Let T₀ = 2π√(L/g) be the time period for small angle of oscillations, where g is the acceleration due to gravity. If air resistance is negligibly small and the string remains straight, then which one of the following is correct?'
 ],['T will be slightly greater than T₀.','T will be slightly smaller than T₀.','T will be exactly equal to T₀.','T will depend upon the mass of the bob.'],'A',
 'Using the exact pendulum equation, T/T₀ = (2/π)K(sin(θ/2)). For θ=60°, the ratio is about 1.0732, greater than one and independent of bob mass. B and C contradict the finite-amplitude correction; D introduces a mass dependence absent from the equation.',['pendulum']),
 row(52,9,'Mechanics/Force and momentum',[
  'Two forces of equal magnitude simultaneously act at a point. It is observed that the resultant force is equal in magnitude to the individual forces. Which of the following statements is/are correct?',
  'I. The angle between one of the individual forces and the resultant force is π/3.','II. The angle between the individual forces is 2π/3.','Select the answer using the code given below.'
 ],['I only','II only','Both I and II','Neither I nor II'],'C',
 'R²=2F²(1+cos θ) and R=F give cos θ=-1/2, so θ=120°. Equal-force symmetry bisects that angle, giving 60° to the resultant. Both statements hold; each other option excludes a true statement.',['motion']),
 row(53,9,'Heat and Waves/Temperature and heat',[
  'A solid of mass m has temperature-dependent specific heat as C(T) = C₀ + αT, where C₀ and α are constants. The solid is heated from T₁ to T₂. Which one of the following is the correct expression for quantity of heat (Q) of the solid mass?'
 ],['Q = mC₀(T₂ − T₁)','Q = m(T₂ − T₁)[C₀ + α(T₁ + T₂)]','Q = m(T₂ − T₁)[C₀(T₁ + T₂) + α]','Q = m(T₂ − T₁)[C₀ + (α/2)(T₁ + T₂)]'],'D',
 'Integrating dQ=m(C₀+αT)dT yields mC₀(T₂−T₁)+(mα/2)(T₂²−T₁²), equivalent to D. A omits temperature dependence, B doubles its contribution, and C does not have the integrated form.',['thermodynamics']),
 row(54,9,'Heat and Waves/Thermodynamics',[
  'In a certain process, the relation between pressure (P) and volume (V), for an ideal gas, is given by PV² = constant. If the initial temperature is T₁ and the final temperature is T₂; and the initial volume is V₁ and the final volume is V₂, then which one of the following is correct?'
 ],['T₁/T₂ = V₁/V₂','T₁/T₂ = (V₁/V₂)²','T₁/T₂ = V₂/V₁','T₁/T₂ = (V₂/V₁)²'],'C',
 'For a fixed amount of ideal gas, PV=nRT. Combining this with PV²=k gives TV=k/(nR), hence T₁/T₂=V₂/V₁. A reverses the relation; B and D incorrectly retain a squared volume dependence after applying PV=nRT.',['thermodynamics']),
 row(55,11,'Heat and Waves/Thermodynamics',[
  'For an ideal gas, a process is described by P = kT, where k is a constant. If the molar heat capacity for this process is C, then which one of the following is correct (where the symbols have their usual meanings)?'
 ],['C = Cₚ','C = Cᵥ','C = (Cₚ + Cᵥ)/2','C is never constant'],'B',
 'P/T=k and PV=nRT imply constant V=nR/k for fixed n. With dV=0, the heat supplied equals the internal-energy change and the process heat capacity is Cᵥ. It is not the constant-pressure capacity or its average; no compulsory temperature variation is implied by the stated process.',['thermodynamics']),
 row(56,11,'Mechanics/Gravitation',[
  'For an object in gravitational field, the gravitational potential is the same at two points A and B, but the gravitational field is not the same at these two points. Which one of the following statements is correct?'
 ],['Positive work is done by gravity in moving the object from point A to point B.','Negative work is done by gravity in moving the object from point A to point B.','Gravity must be non-conservative in such a region.','No work is done by gravity in moving the object from point A to point B.'],'D',
 'Gravitational work is m(V_A−V_B)=0. Different field vectors at equal-potential endpoints do not change that result or make gravity non-conservative. A and B require a nonzero potential difference.',['energy']),
 row(57,11,'Mechanics/Force and momentum',[
  'The position vector of a particle is given by r⃗ = √3 t² î + √2 t ĵ + √5 k̂. Which one of the following statements is correct?'
 ],['The force acting on the particle is parallel to the instantaneous momentum of the particle.','The force acting on the particle is perpendicular to the instantaneous momentum of the particle.','The particle experiences zero force.','The force acting on the particle is not parallel to the instantaneous momentum of the particle.'],'D',
 'Differentiation gives velocity (2√3 t,√2,0) and acceleration (2√3,0,0). The nonzero y component of momentum rules out parallelism to the x-directed force. Force is nonzero and is not generally perpendicular, so A–C are not generally true.',['motion']),
 row(58,11,'Mechanics/Work energy and power',[
  'A ball is dropped from rest from height h above the ground in frame S (the Earth’s frame). Another frame S′ is moving upwards with constant speed u relative to the Earth. In frame S′, the ball has initial downward speed v. Pertaining to the change in kinetic energy (ΔK) of the ball from release to just before hitting the ground as measured in frames S and S′ separately, which one of the following is correct?'
 ],['ΔK is the same in both the frames.','ΔK is larger in frame S.','ΔK is larger in frame S′.','ΔK cannot be compared without the information of mass of the ball.'],'C',
 'Let w=√(2gh) be the final downward Earth-frame speed. In the upward-moving frame initial downward speed is u (so v=u) and final speed is w+u. Thus ΔK′=mgh+muw>mgh=ΔK for u>0. Mass is positive and cannot reverse the comparison. A and B contradict the positive cross term; D is unnecessary.',['energy','motion']),
 row(59,11,'Mechanics/Fluids',[
  'A floating body is in stable state. Which one of the following is correct?'
 ],['The centre of gravity of the body is above its centre of buoyancy.','The centre of gravity of the body is below its centre of buoyancy.','The centre of gravity of the body coincides with its centre of buoyancy.','The centre of gravity of the body is below the metacentre.'],'D',
 'Proposed result: stable small-angle floating equilibrium requires positive metacentric height, with the metacentre above the centre of gravity. The centre-of-buoyancy comparisons A–C are not universal criteria. A directly applicable primary metacentric-stability source still needs to be attached before clearance.',['fluids'],
 'Pending a primary source that explicitly establishes metacentric stability; a general buoyancy chapter alone is insufficient evidence.'),
 row(60,11,'Mechanics/Work energy and power',[
  'A constant power machine pulls a block on a smooth horizontal surface. Which one of the following correctly describes the relation between speed of the block (v) and time (t)?'
 ],['v ∝ t','v ∝ √t','v ∝ t²','v ∝ t³ᐟ²'],'B',
 'P=d(mv²/2)/dt gives v²=v₀²+2Pt/m. B follows only for a rest initial condition or a suitable shifted time origin. A, C and D do not give constant power for a block of fixed mass.',['energy'],
 'The printed stem does not state that the block starts from rest. Do not add that missing initial condition to the source text or approve a strictly proportional answer without resolving the ambiguity.'),
 row(61,13,'Heat and Waves/Temperature and heat',[
  'A 5 g piece of ice at −20 °C is put into m kg of water at 30 °C temperature. The heat is exchanged only between the ice and the water. The final temperature of the mixture is 0 °C in liquid phase. What is the value of m in kg?'
 ],['0·050','0·010','0·015','0·150'],'C',
 'Using NCERT values c_ice=2100 J kg⁻¹ K⁻¹, L_f=3.35×10⁵ J kg⁻¹ and c_water=4186 J kg⁻¹ K⁻¹, 0.005(2100×20+335000)=m×4186×30. This gives m≈0.01501 kg, uniquely selecting 0.015 kg. The other masses fail the heat balance.',['thermal-properties']),
 row(62,13,'Heat and Waves/Sound',[
  'A very large container consists of an ideal gas. The speed of sound in the gas is x. When the pressure of the gas is doubled while keeping the temperature constant, the speed of sound now becomes y. What is the ratio of x to y?'
 ],['1','√2','2','4'],'A',
 'For the same ideal gas, sound speed is √(γRT/M). At fixed temperature, pressure and density double together, leaving the speed unchanged. x/y=1; the other ratios treat density as unchanged or introduce an unsupported pressure dependence.',['waves']),
 row(63,13,'Mechanics/Force and momentum',[
  'A person jumps from a height on soft sand. Which one of the following is the correct reason for less likely injury to the person?'
 ],['The sand exerts no reaction force.','The sand reduces the change in momentum.','The sand increases the impact time.','The sand increases the momentum.'],'C',
 'For approximately the same initial momentum and a final rest state, soft sand extends stopping time and reduces average impact force Δp/Δt. A falsely removes the force that stops the person; B and D confuse the stopping impulse with its duration.',['motion']),
 row(64,13,'Light and Electricity/Optics',[
  'An object is placed far beyond the centre of curvature of a concave mirror. The object then starts accelerating towards the mirror. Which one of the following is correct?'
 ],['The image will accelerate towards the centre of curvature.','The image will accelerate towards the focus.','The image will accelerate towards the pole of the mirror.','The image will move with a constant speed towards the focus.'],'A',
 'While the object remains beyond the centre of curvature, v=fu/(u−f). As u decreases toward 2f, v increases from near f toward 2f; an approaching accelerating object produces an accelerating image toward the centre. B and D reverse the initial direction, and C is inconsistent with this region.',['optics'],
 'The statement does not limit the motion to the initial beyond-centre region. After the object crosses the centre/focus, the unqualified trajectory description needs care. Retain proposed A but require a second-pass ambiguity decision rather than silently restricting the printed stem.'),
 row(65,13,'Mechanics/Work energy and power',[
  'A particle is moved from point X to point Y under a force field. The work done depends only on the initial and final speeds. Which one of the following is correct?'
 ],['The force is conservative.','The net work equals the change in kinetic energy.','The force is constant.','The velocity must always increase.'],'B',
 'The work–energy theorem establishes W_net=½m(v_Y²−v_X²). This alone does not establish a conservative spatial force field or a constant force. Net work can be negative, so increasing velocity is not necessary.',['energy']),
 row(66,13,'Mechanics/Gravitation',[
  'One year at a planet is 8 times as large as compared to the one year at the Earth. Which one of the following is correct about the planet’s orbit?'
 ],['The semimajor axis of the planet’s orbit is same as that of the Earth.','The semimajor axis of the planet’s orbit is twice as compared to that of the Earth.','The semimajor axis of the planet’s orbit is thrice as compared to that of the Earth.','The semimajor axis of the planet’s orbit is four times as compared to that of the Earth.'],'D',
 'For planets orbiting the Sun, Kepler’s third law gives a/a_E=(T/T_E)^(2/3)=8^(2/3)=4. The axis ratios in A–C produce period ratios 1, 2√2 and 3√3 rather than 8.',['gravitation']),
 row(67,15,'Light and Electricity/Electrostatics',[
  'A lightning rod with sharp tip reduces damage risk. Which one of the following is the primary reason for it?'
 ],['It attracts lightning directly.','The sharp tip reduces the local electric field.','It enhances field and promotes continuous corona discharge.','It repels charged clouds.'],'C',
 'The small radius of curvature enhances the local electric field and can initiate corona discharge. B has the field effect reversed and D supplies an unsupported repulsion mechanism. A is not an adequate protection mechanism. The choice wording calls corona the primary protective cause; modern lightning-protection evidence must distinguish that claim from providing a grounded strike path.',[],
 'Needs a directly applicable primary lightning-protection reference and a second-pass decision on the printed primary-reason claim; do not approve solely from a school-level sharp-point rule.'),
 row(68,15,'Light and Electricity/Optics',[
  'A periscope uses two plane mirrors inclined at 45°. If the tube of the periscope is filled with a complete transparent liquid of refractive index 1·5, then which one of the following is correct in respect of the image seen?'
 ],['The image will remain unchanged.','The image will appear laterally shifted.','The image will appear 1·5 times brighter.','The image will appear 1·5 times darker.'],'A',
 'Plane-mirror reflection directions do not depend on the surrounding medium. For axial rays at normal entrance/exit, the usual periscope image geometry is unchanged. A refractive index by itself does not prescribe the fixed brightness factors in C or D; B requires a specified oblique refraction geometry.',['optics'],
 'Entrance/exit geometry and observation conditions are not specified. A is the intended ideal axial-ray interpretation, but complete image behaviour cannot be asserted without qualifying assumptions. Keep pending rather than inserting assumptions into the question.'),
 row(69,15,'Light and Electricity/Optics',[
  'It has been observed that a mirror always forms the image between the pole and the focus, irrespective of the location of the object. Which one of the following is correct in respect of the nature of the mirror?'
 ],['It is a plane mirror.','It is a convex mirror.','It is a concave mirror of small focal length.','It is a concave mirror of large focal length.'],'B',
 'For a real object in front of a convex mirror, the virtual image lies behind the mirror between its pole and focus. Plane mirrors do not have such a finite focal interval; concave mirrors do not keep the image in it for all object locations.',['optics']),
 row(70,15,'Mechanics/Force and momentum',[
  'What is the upward force acting on a skydiver of mass 60 kg who is falling at a uniform speed of 2 m/s?'
 ],['0','60 N','588 N','708 N'],'C',
 'Uniform velocity gives zero acceleration and zero resultant force. Upward air force therefore balances mg=60×9.8=588 N. The downward speed does not add a force term. A, B and D do not balance the weight.',['motion']),
];
