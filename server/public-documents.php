<?php
declare(strict_types=1);
namespace VetCare;
use PDO;
require_once __DIR__.'/database.php';

function pdfText(string $text):string{
 $text=iconv('UTF-8','Windows-1252//TRANSLIT',$text)?:'';return str_replace(['\\','(',')',"\r","\n"],['\\\\','\\(', '\\)',' ',' '],$text);
}
function pdfWrap(string $text,int $length=92):array{
 $text=trim(preg_replace('/\s+/u',' ',$text)??'');if($text==='')return [''];$words=preg_split('/\s+/u',$text)?:[];$lines=[];$line='';foreach($words as $word){$next=$line===''?$word:$line.' '.$word;if(mb_strlen($next)<=$length)$line=$next;else{$lines[]=$line;$line=$word;}}if($line!=='')$lines[]=$line;return array_slice($lines,0,7);
}
function pdfAge(array $row):string{
 $age=json_decode($row['age_snapshot'],true,8,JSON_THROW_ON_ERROR);if(!empty($age['birthDate'])){try{$birth=new \DateTimeImmutable($age['birthDate']);$visit=new \DateTimeImmutable($row['date']);return max(0,$birth->diff($visit)->y).' años';}catch(\Throwable){return '';}}
 if($age['ageValue']!==null&&isset($age['ageUnit']))return $age['ageValue'].' '.(['dias'=>'días','meses'=>'meses','anios'=>'años'][$age['ageUnit']]??'');return '';
}
function pdfBuild(array $row,array $vaccines):string{
 $lines=['q','0.4 w','45 46 505 750 re S','BT /F2 17 Tf 220 770 Td (VetCare) Tj ET','BT /F1 8 Tf 212 757 Td (LA VAQUITA PINTA) Tj ET'];
 $text=static function(string $value,float $x,float $y,float $size=10,string $font='F1')use(&$lines):void{$lines[]='BT /'.$font.' '.$size.' Tf '.$x.' '.$y.' Td ('.pdfText($value).') Tj ET';};
 $line=static function(float $x1,float $y1,float $x2,float $y2)use(&$lines):void{$lines[]=$x1.' '.$y1.' m '.$x2.' '.$y2.' l S';};
 $value=static fn(mixed $v):string=>$v===null||$v===''?'':(string)$v;
 $weight=$row['weight_g']===null?'':number_format(((int)$row['weight_g'])/1000,3).' kg';$temperature=$row['temperature_cent']===null?'':number_format(((int)$row['temperature_cent'])/100,2).' °C';
 $text('Fecha',58,720);$text($row['date'],97,720);$line(95,717,190,717);$text('Propietario',58,701);$text($row['owner_name'],120,701);$line(118,698,330,698);$text('Teléfono',348,701);$text($row['owner_phone'],397,701);$line(395,698,520,698);
 $text('Mascota',58,682);$text($row['patient_name'],108,682);$line(106,679,200,679);$text('Raza',210,682);$text($row['breed']??'',238,682);$line(236,679,340,679);$text('Edad',350,682);$text(pdfAge($row),382,682);$line(380,679,445,679);$text('Peso',454,682);$text($weight,482,682);$line(480,679,540,679);
 $text('PA',58,663);$text($value($row['blood_pressure']),77,663);$line(75,660,135,660);$text('FR',146,663);$text($value($row['respiratory_rate']),165,663);$line(163,660,225,660);$text('FC',236,663);$text($value($row['heart_rate']),255,663);$line(253,660,315,660);$text('Temperatura',350,663);$text($temperature,414,663);$line(412,660,505,660);
 $text('Diagnóstico:',58,639,11,'F2');$text($row['reason'],125,639,11);$line(123,636,540,636);$text('Tratamiento:',58,619,11,'F2');$lines[]='45 470 505 140 re S';$y=602;foreach(pdfWrap(($row['treatment']??'').($row['notes']?' · '.$row['notes']:'')) as $part){$text($part,58,$y,10);$y-=16;}
 $top=445;$bottom=300;$lines[]='45 '.$bottom.' 505 '.($top-$bottom).' re S';foreach([120,205] as $x)$line($x,$bottom,$x,$top);for($y=$top-24;$y>$bottom;$y-=20)$line(45,$y,550,$y);$text('Fecha',65,428,10,'F2');$text('Aplicación',132,428,10,'F2');$text('Observaciones',312,428,10,'F2');$y=408;foreach(array_slice($vaccines,0,6) as $v){$text($v['date'],55,$y);$text($v['product'],127,$y);$text($v['application']??'',210,$y);$y-=20;}
 $text('Documento de consulta',45,75,8);$text('VetCare · La Vaquita Pinta',402,75,8);$lines[]='Q';$content=implode("\n",$lines)."\n";
 $objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>','<< /Length '.strlen($content).' >>' . "\nstream\n".$content.'endstream','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'];$pdf="%PDF-1.4\n";$offsets=[0];foreach($objects as $i=>$object){$offsets[] = strlen($pdf);$pdf.=($i+1)." 0 obj\n".$object."\nendobj\n";}$xref=strlen($pdf);$pdf.='xref' . "\n0 ".(count($objects)+1)."\n0000000000 65535 f \n";for($i=1;$i<=count($objects);$i++)$pdf.=sprintf('%010d 00000 n ',$offsets[$i])."\n";$pdf.='trailer' . "\n<< /Size ".(count($objects)+1).' /Root 1 0 R >>' . "\nstartxref\n".$xref."\n%%EOF";return $pdf;
}
function publicConsultationPdf(string $token):never{
 if(($_SERVER['REQUEST_METHOD']??'GET')!=='GET'){header('Allow: GET');respond(405,['error'=>['code'=>'METHOD_NOT_ALLOWED','message'=>'Método no permitido.']]);}
 $db=centralDatabase();$q=$db->prepare('SELECT c.*,p.name AS patient_name,p.species,p.breed,o.name AS owner_name,o.phone AS owner_phone FROM vc_consultation_documents d JOIN vc_consultations c ON c.id=d.consultation_id JOIN vc_patients p ON p.id=c.patient_id JOIN vc_owners o ON o.id=p.owner_id WHERE d.token_hash=? AND d.revoked_at IS NULL AND d.consultation_version=c.version');$q->execute([hash('sha256',$token)]);$row=$q->fetch();if(!$row)respond(404,['error'=>['code'=>'DOCUMENT_NOT_AVAILABLE','message'=>'El documento ya no está disponible.']]);
 $q=$db->prepare('SELECT date,product,application FROM vc_vaccinations WHERE patient_id=? AND date=? ORDER BY id LIMIT 6');$q->execute([$row['patient_id'],$row['date']]);$pdf=pdfBuild($row,$q->fetchAll());header('Content-Type: application/pdf');header('Content-Disposition: inline; filename="consulta-vetcare.pdf"');header('Content-Length: '.strlen($pdf));echo $pdf;exit;
}
