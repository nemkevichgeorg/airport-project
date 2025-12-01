import React from 'react';
import './BoardingPass.css';


const BoardingPass = ({ passenger, flight, onClose, onNext, onPrevious, currentIndex, totalCount }) => {
    console.log('BoardingPass rendered with passenger:', passenger?.full_name);
  const handlePrint = () => {
    window.print();
  };

  return (
    
    <div className="boarding-pass-print">

            <div className="print-actions">
        <button onClick={handlePrint} className="btn btn-primary">
          🖨️ Печать талона
        </button>
        {totalCount > 1 && (
          <>
            <button 
              onClick={onPrevious} 
              className="btn btn-info"
              disabled={currentIndex === 0}
            >
              ← Предыдущий
            </button>
            <span className="page-counter">
              {currentIndex + 1} / {totalCount}
            </span>
            <button 
              onClick={onNext} 
              className="btn btn-info"
              disabled={currentIndex === totalCount - 1}
            >
              Следующий →
            </button>
          </>
        )}
        <button onClick={onClose} className="btn btn-secondary">
          Завершить
        </button>
      </div>


      <div className="boarding-pass">

        <div className='main-part'>

          <div className='pass-header'>
            <span className='pass-title'>MOW airport</span>
          </div>
          <div className='bold-line'>
            <span className='bold-line-title'>BOARDING PASS</span>
          </div>

          <div className='first-sector'>
            <div className='sector-1'>
              <span className='value-1'>{flight?.flight_number}</span>
            </div>
            <div className='sector-2'>
              <span className='value-1'>MOW ➞ {flight?.arrival_airport}</span>
              <span className='value-2'>{new Date(flight.departure_time).toLocaleDateString('EN', {month: "short", day: "2-digit"}).toUpperCase().replace(/ /g, '')} {flight?.departure_time ? new Date(flight.departure_time).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
            </div>
            <div className='sector-2'>
              <span className='value-1'>{passenger?.seat_number || 'Не назначено'}</span>
              <span className='value-2'>{passenger?.class_type.toUpperCase()}</span>
            </div>
          </div>
        </div>


        <div className='second-part'>
          <div className='pass-header'>
            <div className='pass-title'><span className='snd-pass-title'>MOW</span></div>
          </div>
          <div className='bold-line'>
            <div className='bold-line-title'><span className='snd-bold-line-title'>airport</span></div>
          </div>
          <div className='second-sector'>
            <div className='sector-3'>
              <span className='value-2'>{passenger?.full_name.toUpperCase()}</span>
              <span className='value-2'>{passenger?.document_number || 'N/A'}</span>
            </div>
            <div className='sector-4'><img 
              src={'https://barcode.tec-it.com/barcode.ashx?data=' 
              + passenger?.boarding_pass_number + 
              '&multiplebarcodes=true&unit=Min&imagetype=Png&showhrt=no'}
              alt={'Baggage barcode ' + passenger?.boarding_pass_number}
            /></div>
            <div className='sector-5'>
              <div className='sector-6'>
                <span className='value-1'>{flight?.departure_time ? new Date(new Date(flight.departure_time).getTime() - 45 * 60000).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'}) : 'N/A'}</span>
                <span className='value-2'>{passenger?.boarding_pass_number || 'N/A'}</span>
              </div>
                <div className='sector-7'>
                  <span className='value-1'>{flight?.gate_number || 'Не назначен'}</span>
                  <span className='value-2'>GATE</span>
                </div>
            </div>

          </div>
        </div>


        <div className='third-part'>
          <div className='pass-header'>
            <span className='pass-title'>MOW airport</span>
          </div>
          <div className='bold-line'>
            <span className='bold-line-title'>BOARDING PASS</span>
          </div>
          <div className='third-sector'>
            <div className='sector-8'>
                <div className='sector-9'>
                  <span className='value-3'>{flight?.flight_number}</span>
                  <span className='value-3'>MOW-{flight?.arrival_airport}</span>
                  
                </div>
                <div className='sector-10'>
                  <span className='value-3'>{new Date(flight.departure_time).toLocaleDateString('EN', {month: "short", day: "2-digit"}).toUpperCase().replace(/ /g, '')}</span>
                  <span className='value-3'>{flight?.gate_number || 'Не назначен'}</span>
                </div>
            </div>
            <div className='sector-12'><span className='value-2'>{passenger?.boarding_pass_number || 'N/A'}</span><img 
              src={'https://barcode.tec-it.com/barcode.ashx?data=' 
              + passenger?.boarding_pass_number + 
              '&multiplebarcodes=true&unit=Min&imagetype=Png&showhrt=no'}
              alt={'Baggage barcode ' + passenger?.boarding_pass_number}
            /></div>
            <div className='sector-11'>
              <span className='value-3'>{passenger?.full_name.toUpperCase().substring(0, 18)}</span>
              <span className='value-3'>{passenger?.document_number || 'N/A'}</span>
              <span className='value-1'>{passenger?.seat_number || 'Не назначено'}</span>
              <span className='value-3'>{passenger?.class_type.toUpperCase()}</span>
            </div>


              

          </div>
        </div>



        








        

      </div>



            


    </div>



  );
};

export default BoardingPass;