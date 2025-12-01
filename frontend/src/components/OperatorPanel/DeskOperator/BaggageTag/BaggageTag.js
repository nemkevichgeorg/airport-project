import React from 'react';
import './BaggageTag.css';

const BaggageTag = ({ luggage, passenger, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="baggage-tag-print">
      <div className="print-actions">
        <button onClick={handlePrint} className="btn btn-secondary">
          Печать бирки
        </button>
        <button onClick={onClose} className="btn btn-secondary">
          Закрыть
        </button>
      </div>
      




      <div className="new-baggage-tag">
        <div className='tag_info'>
          <span className="value">------------------------------</span>
        </div>
        <div className='barcode_info'>
          <span className="flipped_barcode_value">{luggage.tag_id}</span>
        </div>
        <div className='barcode'><img 
                src={'https://barcode.tec-it.com/barcode.ashx?data=' 
                    + luggage.tag_id + 
                    '&multiplebarcodes=true&unit=Min&imagetype=Png&showhrt=no'}
                alt={'Baggage barcode ' + luggage.tag_id}
        /></div>
        <div className='barcode'><img 
                src={'https://barcode.tec-it.com/barcode.ashx?data=' 
                    + luggage.tag_id + 
                    '&multiplebarcodes=true&unit=Min&imagetype=Png&rotation=90&showhrt=no'}
                alt={'Baggage barcode ' + luggage.tag_id}
        /></div>
        <div className='barcode_info'>
          <span className="flipped_barcode_value">{luggage.tag_id}</span>
        </div>
        <div className="tag_info">
            <div className='flipped_tag_info'>
              <span className="value">MOW → {luggage.arrival_airport}</span>
              <span className="value">{luggage.flight_number} / {new Date(luggage.date).toLocaleDateString('EN', {month: "short", day: "2-digit"}).toUpperCase().replace(/ /g, '')}</span>
              <span className="value">------------------------------</span>
            </div>
            <div className='flipped_arrival_airport'>
                <span className="iata_code">{luggage.arrival_airport}</span>
            </div>
            <span className="value">------------------------------</span>
            <span className="value">{passenger?.full_name.toUpperCase().substring(0, 15)}</span>
            <span className="value">{luggage.tag_id}</span>
            <span className="value">------------------------------</span>
            <div className='arrival_airport'>
                <span className="iata_code">{luggage.arrival_airport}</span>
            </div>
            <div className='tag_info'>
              <span className="value">{luggage.flight_number} / {new Date(luggage.date).toLocaleDateString('EN', {month: "short", day: "2-digit"}).toUpperCase().replace(/ /g, '')}</span>
              <span className="value">MOW → {luggage.arrival_airport}</span>
              <span className="value">------------------------------</span>
            </div>
        </div>
        <div className='barcode_info'>
          <span className="barcode_value">{luggage.tag_id}</span>
        </div>
        <div className='barcode'><img 
                src={'https://barcode.tec-it.com/barcode.ashx?data=' 
                    + luggage.tag_id + 
                    '&multiplebarcodes=true&unit=Min&imagetype=Png&showhrt=no'}
                alt={'Baggage barcode ' + luggage.tag_id}
        /></div>
        <div className='barcode'><img 
                src={'https://barcode.tec-it.com/barcode.ashx?data=' 
                    + luggage.tag_id + 
                    '&multiplebarcodes=true&unit=Min&imagetype=Png&rotation=90&showhrt=no'}
                alt={'Baggage barcode ' + luggage.tag_id}
        /></div>
        <div className='barcode_info'>
          <span className="barcode_value">{luggage.tag_id}</span>
        </div>
        <div className="tag_info">
            <span className="value">------------------------------</span>
        </div>
        <div className='barcode_mini'><img 
                src={'https://barcode.tec-it.com/barcode.ashx?data=' 
                    + luggage.tag_id + 
                    '&multiplebarcodes=true&unit=Min&imagetype=Png&showhrt=no'}
                alt={'Baggage barcode ' + luggage.tag_id}
        /></div>
        <div className='barcode_info'>
          <span className="value">{luggage.tag_id}</span>
        </div>
        <div className="tag_info">
            <span className="value">------------------------------</span>
        </div>
        <div className='barcode_mini'><img 
                src={'https://barcode.tec-it.com/barcode.ashx?data=' 
                    + luggage.tag_id + 
                    '&multiplebarcodes=true&unit=Min&imagetype=Png&showhrt=no'}
                alt={'Baggage barcode ' + luggage.tag_id}
        /></div>
        <div className='barcode_info'>
          <span className="value">{luggage.tag_id}</span>
        </div>
                <div className="tag_info">
            <span className="value">------------------------------</span>
        </div>
        <div className='tag_info'>
          <span className="mini_value">IDENTIFICATION TAG</span>
        </div>
        <div className='barcode_mini'><img 
                src={'https://barcode.tec-it.com/barcode.ashx?data=' 
                    + luggage.tag_id + 
                    '&multiplebarcodes=true&unit=Min&imagetype=Png&showhrt=no'}
                alt={'Baggage barcode ' + luggage.tag_id}
        /></div>
        <div className='barcode_info'>
          <span className="barcode_value">{luggage.tag_id}</span>
        </div>
        <div className='tag_info'>
          <span className="value">{passenger?.full_name.toUpperCase().substring(0, 15)}</span>
          <span className="value">{luggage.flight_number} / {new Date(luggage.date).toLocaleDateString('EN', {month: "short", day: "2-digit"}).toUpperCase().replace(/ /g, '')}</span>
          <span className="value">MOW → {luggage.arrival_airport}</span>
          <span className="value">------------------------------</span>
        </div>


      </div>
    </div>
  );
};

export default BaggageTag;